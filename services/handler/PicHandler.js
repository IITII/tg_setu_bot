/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'
const {uniq} = require('lodash')
const {queueName, eventName, clip, DEBUG} = require('../../config/config'),
  eventBus = require('../../libs/event_bus'),
  Storage = require('../../libs/storage'),
  download_queue = queueName.download,
  download_event = eventName.download,
  download_storage = new Storage(queueName.download),
  queue = queueName.pic_add,
  event = eventName.pic_add,
  storage = new Storage(queue)
const {run_out_mq} = require('../utils/mq_utils'),
  {logger} = require('../../middlewares/logger'),
  {currMapLimit, time_human_readable, downloadFile, format_sub_title, sleep, format_date} = require('../../libs/utils'),
  {zipUrlExt, getSaveDir} = require('../../libs/download/dl_utils'),
  {send_text, getMediaGroupMsg, sendBatchMsg, getDoneTextMsg} = require('../utils/msg_utils'),
  {log_ph, log_related, log_meta_tag} = require('../utils/service_utils'),
  {getLimitByUrl, handle_sup_url, filter_deny_urls} = require('../utils/support_urls_utils')
const {set_sent_sub} = require('../utils/redis_utils')

async function start() {
  await consume(event, storage, queue)
  await consume(download_event, download_storage, download_queue)
}

async function consume(event, storage, queue) {
  eventBus.on(event, async v => {
    await run_out_mq(storage, queue, handle_msg)
  })
  eventBus.emit(event, 'start')
}

async function handle_msg(bot, msg) {
  const start = Date.now()
  const {chat_id, message_id, session, urls} = msg
  const {mode} = session.pic
  const {photos, diff, cost} = await fetchPhotos(uniq(urls))
  if (diff.length > 0) {
    let handle_summary = `**嗅探详情: ${photos.length} in ${cost}**\n\n**额外新增链接条数：${diff.length}**\n\n${log_ph(diff)}`
    await send_text(chat_id, handle_summary, message_id)
  }
  for (const ph of photos) {
    if (DEBUG) continue
    let {title, meta, tags, imgs, original, external} = ph
    const prefixMsg = `[${title}](${original})`
    let batchMsg = []
    switch (mode) {
      case 'download':
        const limit = getLimitByUrl(original)
        const saveDir = getSaveDir(title, clip.baseDir)
        // const sleepT = new URL(original).hostname.includes("dongtidemi") ? 800 : 0
        await handle_download(prefixMsg, imgs, saveDir, original, chat_id, message_id, limit)
        break
      case 'copy':
        batchMsg = getMediaGroupMsg(chat_id, imgs, prefixMsg)
        // await sendMediaGroup(chat_id, imgs, prefixMsg)
        break
      case 'init':
      default:
        await send_text(chat_id, `这啥模式：${mode}`, message_id)
        break
    }
    let endMsg = `#MarkAsDone\n[${title}](${original})\n\n`
    endMsg += log_meta_tag(meta, true)
    endMsg += log_meta_tag(tags, false)
    logger.debug(endMsg)
    if (batchMsg.length > 0) {
      let mt = [meta, tags].flat(Infinity).filter(_ => !!_)
      batchMsg = [batchMsg, getDoneTextMsg(chat_id, endMsg, mt, message_id, external)].flat(Infinity)
      await sendBatchMsg(batchMsg)
    } else {
      await send_text(chat_id, endMsg, message_id)
    }
  }
  let related_msg = log_related(photos)
  related_msg += `\n#BatchDone
Cost: ${time_human_readable(Date.now() - start)}
Start: ${format_date(start)}
End: ${format_date()}`
  await send_text(chat_id, related_msg, message_id)
  // update redis
  await set_sent_sub(photos.map(({title, original}) => ({url: original, text: format_sub_title(title)})))
}

async function fetchPhotos(urls) {
  const crawlStart = new Date()
  let photos = await currMapLimit(urls, clip.webLimit, handle_sup_url)
  photos = photos.flat(Infinity)
    .map(_ => {
      _.imgs = filter_deny_urls(_.imgs)
      return _
    })
    .filter(_ => _.imgs.length > 0)
  const diff = photos.filter(({original}) => !urls.includes(original))
  const cost = time_human_readable(new Date() - crawlStart)
  return {photos, diff, cost}
}

async function handle_download(prefixMsg, imgs, saveDir, refers,
                               chat_id, message_id,
                               limit = clip.telegrafLimit,
                               sleepTime = 0,
                               start = Date.now()) {
  let url_saves = await zipUrlExt(imgs, saveDir, limit)
  url_saves = url_saves.filter(_ => _.savePath)
  if (imgs.length !== url_saves.length) {
    prefixMsg += `#后缀获取失败\n后缀获取失败: ${imgs.length - url_saves.length}条\n`
  }
  const headCost = time_human_readable(Date.now() - start)
  await send_text(chat_id, `${prefixMsg} ${url_saves.length} in ${headCost}, 下载开始...`)

  let download_failed = [], hostname
  let anti_strict, url_prefer_refers
  // anti_strict = ['wp.com', 'kul.mrcong.com']
  anti_strict = ['wp.com']
  url_prefer_refers = [['mrcong.com', 'https://www.mrcong.com/'], ['', refers]]
  async function handle(json) {
    try {
      hostname = new URL(json.url).hostname
      refers = url_prefer_refers.find(_ => hostname.includes(_[0]))[1]
      const res = await downloadFile(json.url, json.savePath, refers)
      if (sleepTime > 0) {
        await sleep(sleepTime)
      }
      if (anti_strict.some(at => hostname.includes(at))) {
        sleepTime = 900
        logger.debug(`sleep another ${sleepTime}ms for wp.com...`)
        await sleep(sleepTime)
      }
      return res
    } catch (e) {
      download_failed.push([json.url, e.message])
    }
  }

  return currMapLimit(url_saves, limit, handle)
    .then(_ => {
      const cost = time_human_readable(new Date() - start)
      prefixMsg += `下载完成, ${url_saves.length} in ${cost}\n`
    })
    .catch(e => {
      prefixMsg += `下载失败, ${e.message}\n#下载失败\n`
      logger.error(e)
    })
    .finally(async () => {
      if (download_failed.length > 0) {
        prefixMsg += `下载失败: ${download_failed.length}条\n`
        prefixMsg += download_failed.map(_ => _.join(' -> ')).join('\n')
        prefixMsg += '\n#下载失败\n'
      }
      logger.info(prefixMsg)
      return send_text(chat_id, prefixMsg, message_id)
    })
}

module.exports = {
  start,
}
