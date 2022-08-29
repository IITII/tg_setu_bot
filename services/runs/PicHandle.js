/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'
const {uniq} = require('lodash')
const {queueName, eventName, clip, DEBUG} = require('../../config/config'),
  eventBus = require('../../libs/event_bus'),
  Storage = require('../../libs/storage'),
  queue = queueName.pic_add,
  event = eventName.pic_add,
  storage = new Storage(queue)
const {run_out_mq} = require('./mq_utils'),
  {logger} = require('../../middlewares/logger'),
  {currMapLimit, time_human_readable, downloadFile, format_sub_title, sleep} = require('../../libs/utils'),
  {zipUrlExt, getSaveDir} = require('../../libs/download/dl_utils'),
  {send_text, getMediaGroupMsg, getTextMsg, sendBatchMsg} = require('../utils/msg_utils'),
  {log_ph, log_related, log_meta_tag} = require('../utils/service_utils'),
  {getLimitByUrl, handle_sup_url} = require('../utils/support_urls_utils')
const {set_sent_sub} = require('../tasks/redis_utils')

async function start() {
  eventBus.on(event, consume)
  eventBus.emit(event, 'start')
}

async function consume() {
  await run_out_mq(storage, queue, handle_msg)
}

async function handle_msg(bot, msg) {
  const {chat_id, message_id, session, urls} = msg
  const {mode} = session.pic
  const {photos, diff, cost} = await fetchPhotos(uniq(urls))
  if (diff.length > 0) {
    let handle_summary = `**嗅探详情: ${photos.length} in ${cost}**\n\n**额外新增链接条数：${diff.length}**\n\n${log_ph(diff)}`
    await send_text(chat_id, handle_summary, message_id)
  }
  for (const ph of photos) {
    if (DEBUG) continue
    let {title, meta, tags, imgs, original} = ph
    const prefixMsg = `[${title}](${original})`
    let batchMsg = []
    switch (mode) {
      case 'download':
        const limit = getLimitByUrl(original)
        const saveDir = getSaveDir(title, clip.baseDir)
        const sleepT = new URL(original).hostname.includes("dongtidemi") ? 800 : 0
        await handle_download(prefixMsg, imgs, saveDir, original, chat_id, message_id, limit, sleepT)
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
      batchMsg = [batchMsg, getTextMsg(chat_id, endMsg, message_id)].flat(Infinity)
      await sendBatchMsg(batchMsg)
    } else {
      await send_text(chat_id, endMsg, message_id)
    }
  }
  const related_msg = log_related(photos)
  if (related_msg) {
    await send_text(chat_id, related_msg, message_id)
  }
  // update redis
  await set_sent_sub(photos.map(({title, original}) => ({url: original, text: format_sub_title(title)})))
}

async function fetchPhotos(urls) {
  const crawlStart = new Date()
  let photos = await currMapLimit(urls, clip.webLimit, handle_sup_url)
  photos = photos.flat(Infinity).filter(_ => _.imgs.length > 0)
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

  async function handle(json) {
    const res = await downloadFile(json.url, json.savePath, refers)
    if (sleepTime > 0) {
      await sleep(sleepTime)
    }
    return res
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
      logger.info(prefixMsg)
      return send_text(chat_id, prefixMsg, message_id)
    })
}

// async function handle_queue(bot, msg) {
//   const {chat_id, message_id, session, urls} = msg
//   const crawlStart = new Date()
//   let photos = await currMapLimit(urls, clip.webLimit, handle_sup_url)
//   photos = photos.flat(Infinity).filter(_ => _.imgs.length > 0)
//   let handle_summary = `**嗅探详情: ${photos.length} in ${time_human_readable(new Date() - crawlStart)}\n\n**`
//   handle_summary += log_ph(photos)
//   const diff = difference(photos.map(_ => _.original), urls)
//     .map(u => photos.find(_ => _.original === u))
//   if (diff.length > 0) {
//     handle_summary += `\n**额外新增链接条数：${diff.length}\n**`
//     handle_summary += log_ph(diff)
//   }
//   await send_text(chat_id, handle_summary, message_id)
//
//   let need_del = []
//   let reviewMsg = ''
//   for (let i = 0; i < photos.length; i++) {
//     const ph = photos[i]
//     const {title, meta, tags, imgs, original} = ph
//     const mkHead = `[${title}](${original}) `
//     // const sMsg = `${mkHead}download started`
//     const sMsg = `${mkHead}下载开始`
//
//     need_del = []
//     reviewMsg = `${mkHead}\n`
//
//     logger.info(sMsg)
//     await send_text(chat_id, sMsg)
//     await downloadImgs(mkHead, imgs, original, getLimitByUrl(original))
//     if (session && session.review === 2) {
//       const need_send = imgs.map(_ => _.savePath).flat(Infinity)
//       await sendCopyDel(need_send, title)
//     }
//     let endMsg = `#MarkAsDone\n${reviewMsg}`
//     endMsg += log_meta_tag(meta, true)
//     endMsg += log_meta_tag(tags, false)
//     logger.debug(endMsg)
//     await send_del_file(chat_id, need_del, endMsg, message_id)
//   }
//   const related_msg = log_related(photos)
//   if (related_msg) {
//     await send_text(chat_id, related_msg, message_id)
//   }
//
//   async function downloadImgs(dlMsg, imgs,
//                               refers = '',
//                               limit = clip.telegrafLimit,
//                               start = new Date()) {
//     if (DEBUG) return
//
//     async function handle(json) {
//       return downloadFile(json.url, json.savePath, refers)
//     }
//
//     return currMapLimit(imgs, limit, handle)
//       .then(_ => {
//         const cost = time_human_readable(new Date() - start)
//         // dlMsg += `download done, ${imgs.length} in ${cost}s\n`
//         dlMsg += `下载完成, ${imgs.length} in ${cost}\n`
//         logger.info(dlMsg)
//       })
//       .catch(e => {
//         // dlMsg += `download failed, ${e.message}\n`
//         dlMsg += `下载失败, ${e.message}\n`
//         logger.error(e)
//       })
//       .finally(async () => {
//         return send_text(chat_id, dlMsg)
//       })
//   }
//
//   async function sendCopyDel(need_send, title) {
//     if (DEBUG) return
//     await sendMediaGroup(chat_id, need_send, title)
//       .then(_ => {
//         // reviewMsg += `Send total: ${need_send.length}\n`
//         reviewMsg += `共发送图片: ${need_send.length}\n`
//       })
//       .catch(e => {
//         // reviewMsg += `Send failed, ${e.message}\n`
//         reviewMsg += `发送失败, ${e.message}\n`
//         logger.error(reviewMsg)
//         logger.error(e)
//       })
//       .finally(async () => {
//         if (session && session.del === 1) {
//           need_del = uniq(need_send.map(_ => path.dirname(_)))
//           // reviewMsg += `Clean total: ${need_del.length}\n`
//           reviewMsg += `删除文件夹数目: ${need_del.length}\n`
//         }
//       })
//   }
// }

module.exports = {
  start,
}