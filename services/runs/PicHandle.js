/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'
const {queueName, eventName, clip, DEBUG} = require('../../config/config'),
  eventBus = require('../../libs/event_bus'),
  Storage = require('../../libs/storage'),
  queue = queueName.pic_add,
  event = eventName.pic_add,
  storage = new Storage(queue)
const {run_out_mq} = require('./mq_utils')
const {currMapLimit, time_human_readable, downloadFile} = require('../../libs/utils')
const {log_ph, log_related, log_meta_tag} = require('../utils/service_utils')
const {difference, uniq} = require('lodash')
const {send_text, send_del_file, sendMediaGroup} = require('../utils/msg_utils')
const {logger} = require('../../middlewares/logger')
const path = require('path')
const {getLimitByUrl, handle_sup_url} = require('../utils/support_urls_utils')

async function start() {
  eventBus.on(event, consume)
  eventBus.emit(event, 'start')
}

async function consume() {
  await run_out_mq(storage, queue, handle_queue)
}


async function handle_queue(bot, msg) {
  const {chat_id, message_id, session, urls} = msg
  const crawlStart = new Date()
  let photos = await currMapLimit(urls, clip.webLimit, handle_sup_url)
  photos = photos.flat(Infinity).filter(_ => _.imgs.length > 0)
  let handle_summary = `**嗅探详情: ${photos.length} in ${time_human_readable(new Date() - crawlStart)}\n\n**`
  handle_summary += log_ph(photos)
  const diff = difference(photos.map(_ => _.original), urls)
    .map(u => photos.find(_ => _.original === u))
  if (diff.length > 0) {
    handle_summary += `\n**额外新增链接条数：${diff.length}\n**`
    handle_summary += log_ph(diff)
  }
  await send_text(chat_id, handle_summary, message_id)

  let need_del = []
  let reviewMsg = ''
  for (let i = 0; i < photos.length; i++) {
    const ph = photos[i]
    const {title, meta, tags, imgs, original} = ph
    const mkHead = `[${title}](${original}) `
    // const sMsg = `${mkHead}download started`
    const sMsg = `${mkHead}下载开始`

    need_del = []
    reviewMsg = `${mkHead}\n`

    logger.info(sMsg)
    await send_text(chat_id, sMsg)
    await downloadImgs(mkHead, imgs, original, getLimitByUrl(original))
    if (session && session.review === 2) {
      const need_send = imgs.map(_ => _.savePath).flat(Infinity)
      await sendCopyDel(need_send, title)
    }
    let endMsg = `#MarkAsDone\n${reviewMsg}`
    endMsg += log_meta_tag(meta, true)
    endMsg += log_meta_tag(tags, false)
    logger.debug(endMsg)
    await send_del_file(chat_id, need_del, endMsg, message_id)
  }
  const related_msg = log_related(photos)
  if (related_msg) {
    await send_text(chat_id, related_msg, message_id)
  }

  async function downloadImgs(dlMsg, imgs,
                              refers = '',
                              limit = clip.telegrafLimit,
                              start = new Date()) {
    if (DEBUG) return

    async function handle(json) {
      return downloadFile(json.url, json.savePath, refers)
    }

    return currMapLimit(imgs, limit, handle)
      .then(_ => {
        const cost = time_human_readable(new Date() - start)
        // dlMsg += `download done, ${imgs.length} in ${cost}s\n`
        dlMsg += `下载完成, ${imgs.length} in ${cost}\n`
        logger.info(dlMsg)
      })
      .catch(e => {
        // dlMsg += `download failed, ${e.message}\n`
        dlMsg += `下载失败, ${e.message}\n`
        logger.error(e)
      })
      .finally(async () => {
        return send_text(chat_id, dlMsg)
      })
  }

  async function sendCopyDel(need_send, title) {
    if (DEBUG) return
    await sendMediaGroup(chat_id, need_send, title)
      .then(_ => {
        // reviewMsg += `Send total: ${need_send.length}\n`
        reviewMsg += `共发送图片: ${need_send.length}\n`
      })
      .catch(e => {
        // reviewMsg += `Send failed, ${e.message}\n`
        reviewMsg += `发送失败, ${e.message}\n`
        logger.error(reviewMsg)
        logger.error(e)
      })
      .finally(async () => {
        if (session && session.del === 1) {
          need_del = uniq(need_send.map(_ => path.dirname(_)))
          // reviewMsg += `Clean total: ${need_del.length}\n`
          reviewMsg += `删除文件夹数目: ${need_del.length}\n`
        }
      })
  }
}

module.exports = {
  start
}