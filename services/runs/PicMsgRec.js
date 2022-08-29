/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'
const {queueName, eventName} = require('../../config/config'),
  eventBus = require('../../libs/event_bus'),
  Storage = require('../../libs/storage'),
  {telegram} = require('../../libs/telegram_bot'),
  queue = queueName.pic_add,
  event = eventName.pic_add,
  storage = new Storage(queue)
const {uniq} = require('lodash'),
  {logger} = require('../../middlewares/logger'),
  {message_decode} = require('../utils/service_utils'),
  {send_text} = require('../utils/msg_utils'),
  debMap = new Map()

async function handle_ctx(ctx) {
  const message = ctx.message || ctx.update.message
  const chat_id = message.chat.id,
    message_id = message.message_id,
    session = ctx.session
  const {img_or_tags} = session.opts
  const urls = message_decode(message, img_or_tags)
  if (urls.length === 0) {
    // const msg = `no url in message: ${JSON.stringify(message)}`
    const msg = `请检查当前模式,无法解析消息: ${JSON.stringify(message)}`
    return ctx.reply(msg, {reply_to_message_id: message_id})
  }
  const urlInfo = {chat_id, message_id, session, urls}
  return debounce(urlInfo)
}

// 按 message id 精细化区分
async function debounce(urlInfo) {
  const {chat_id, message_id, session, urls} = urlInfo
  let timerInfo = {timer: null, count: 0, urls: [], delay: 500}
  const mapKey = `${chat_id}_${JSON.stringify(session)}`
  if (debMap.has(mapKey)) {
    timerInfo = debMap.get(mapKey)
    clearTimeout(timerInfo.timer)
    timerInfo.urls = timerInfo.urls.concat(urls)
  } else {
    timerInfo.urls = urls
  }
  timerInfo.urls = uniq(timerInfo.urls)
  timerInfo.count = timerInfo.urls.length
  timerInfo.timer = setTimeout(async () => {
    await timeout(chat_id, message_id, session, mapKey, timerInfo)
  }, timerInfo.delay)
  debMap.set(mapKey, timerInfo)
}

async function timeout(chat_id, message_id, session, k, info) {
  const s = `#Add_Queue\n#${session.pic.mode}\n添加 ${info.count} 条链接到队列`
  const v = {chat_id, message_id, session, urls: info.urls}
  await storage.rpush(v)
  debMap.delete(k)
  eventBus.emit(event, v)
  try {
    const url_t = info.urls.join('\n')
    const msg = `${s}\n${url_t}`
    if (msg.length >= 3000) {
      await send_text(chat_id, msg, message_id)
    } else {
      // 消息插队
      await telegram.sendMessage(chat_id, msg, {reply_to_message_id: message_id, disable_web_page_preview: true})
    }
  } catch (e) {
    logger.error(`${e.message}`)
    logger.error(e)
    if (e.message.includes('429')) {
      await send_text(chat_id, s, message_id)
    }
  }
}

module.exports = handle_ctx