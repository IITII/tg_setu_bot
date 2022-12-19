/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'
const {queueName, eventName, taskLimit} = require('../../config/config'),
  eventBus = require('../../libs/event_bus'),
  Storage = require('../../libs/storage'),
  {telegram} = require('../../libs/telegram_bot'),
  // sub_send_event = eventName.sub_send,
  // sub_send_storage = new Storage(queueName.sub_send),
  download_event = eventName.download,
  download_storage = new Storage(queueName.download),
  queue = queueName.pic_add,
  event = eventName.pic_add,
  storage = new Storage(queue)
const {uniq, chunk} = require('lodash'),
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
  let urls = message_decode(message, img_or_tags)
  if (urls.length === 0) {
    // 在转发 mediaGroup 的时候, 机器人会接受到和 media 数量相同个 msg,
    // 每一个 msg 里面的 photo 都是同一张图片的不同分辨率,
    // 使用 message.media_group_id 进行区分
    if (message.media_group_id) {
      return Promise.resolve('ignore')
    }
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
  // urls: [{msg_id: '', url: ''}]
  let timerInfo = {timer: null, count: 0, urls: [], delay: 500}
  let msg_urls = urls.map(url => ({message_id, url}))
  const mapKey = `${chat_id}_${JSON.stringify(session)}`
  if (debMap.has(mapKey)) {
    timerInfo = debMap.get(mapKey)
    clearTimeout(timerInfo.timer)
  }
  msg_urls = msg_urls.filter(({message_id, url}) => !timerInfo.urls.some(u => u.url === url))
  timerInfo.urls = timerInfo.urls.concat(msg_urls)
  // timerInfo.urls = uniq(timerInfo.urls)
  timerInfo.count += msg_urls.length
  timerInfo.timer = setTimeout(async () => {
    await timeout(chat_id, message_id, session, mapKey, timerInfo)
  }, timerInfo.delay)
  debMap.set(mapKey, timerInfo)
}

async function timeout(chat_id, message_id, session, k, info) {
  const s = `#Add_Queue\n#${session.pic.mode}\n添加 ${info.count} 条链接到队列`
  const grouped = chunk(info.urls, taskLimit.message.batch_add_max)
  for (const msg_url of grouped) {
    let msg_id, urls
    msg_id = msg_url[msg_url.length - 1].message_id
    urls = msg_url.map(u => u.url)
    // encode url for request
    urls = urls.map(u => u.includes('%') ? u : encodeURI(u))
    const v = {chat_id, message_id: msg_id, session, urls}
    await split_storage_event(v)
  }
  debMap.delete(k)
  try {
    const url_t = info.urls.map(_ => _.url).join('\n')
    const msg = `${s}\n${url_t}`
    if (msg.length >= 3000) {
      await send_text(chat_id, msg, message_id, false, '')
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

async function split_storage_event(message) {
  if (!message) return Promise.reject('no message')
  let mode, st, eve, msg
  msg = Array.isArray(message) ? message[0] : message
  mode = msg?.session?.pic?.mode
  switch (mode) {
    case 'download':
      st = download_storage
      eve = download_event
      break
    case 'copy':
    case 'init':
    default:
      st = storage
      eve = event
      break
  }
  logger.debug('split_storage_event', {mode, eve, msg})
  return st.rpush(message).then(_ => eventBus.emit(eve, _))
}

module.exports = handle_ctx
