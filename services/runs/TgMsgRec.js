/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'
/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'
const {queueName, eventName} = require('../../config/config'),
  eventBus = require('../../libs/event_bus'),
  Storage = require('../../libs/storage'),
  queue = queueName.pic_add,
  event = eventName.pic_add,
  storage = new Storage(queue)
const {message_decode} = require('../service_utils'),
  {uniq} = require('lodash'),
  {send_text} = require('../msg_utils'),
  debMap = new Map()

async function handle_ctx(ctx) {
  const message = ctx.message || ctx.update.message
  const urls = message_decode(message)
  if (urls.length === 0) {
    // const msg = `no url in message: ${JSON.stringify(message)}`
    const msg = `无法解析消息: ${JSON.stringify(message)}`
    return ctx.reply(msg)
  }
  return debounce(ctx, urls)
}

async function debounce(ctx, urls) {
  let v = {timer: null, count: 0, urls: [], delay: 500}
  const chat_id = ctx.chat.id
  const mapKey = `${chat_id}_${JSON.stringify(ctx.session)}`
  if (debMap.has(mapKey)) {
    v = debMap.get(mapKey)
    clearTimeout(v.timer)
    v.urls = v.urls.concat(urls)
  } else {
    v.urls = urls
  }
  v.urls = uniq(v.urls)
  v.count = v.urls.length
  v.timer = setTimeout(async () => {
    await timeout(chat_id, mapKey, v)
  })
  debMap.set(mapKey, v)
}

async function timeout(chat_id, k, v) {
  const s = `添加 ${v.count} 条链接到队列`
  await storage.rpush(v)
  debMap.delete(k)
  eventBus.emit(event, v)
  await send_text(chat_id, s)
}

module.exports = handle_ctx