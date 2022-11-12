/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/09/27
 */
'use strict'
const {ids, queueName, eventName, tokens, taskLimit} = require('../../config/config'),
  {logger} = require('../../middlewares/logger'),
  {done_arr_end, handle_429, send_text} = require('../utils/msg_utils'),
  {run_out_mq} = require('../utils/mq_utils'),
  {message_decode} = require('../utils/service_utils'),
  TelegramBot = require('../../libs/bots/TelegramBot'),
  subBot = TelegramBot(tokens.subscribe),
  eventBus = require('../../libs/event_bus'),
  Storage = require('../../libs/storage'),
  pic_add_queue = queueName.pic_add,
  pic_add_event = eventName.pic_add,
  pic_add_storage = new Storage(pic_add_queue),
  action_worker_queue = queueName.action_worker,
  action_worker_event = eventName.action_worker,
  action_worker_storage = new Storage(action_worker_queue)
const {redis_add_sub, HGET} = require('../utils/redis_utils')

module.exports = {
  start,
  rebuildTextMsg,
}

async function start() {
  eventBus.on(action_worker_event, consume)
  eventBus.emit(action_worker_event, 'start')
}

async function consume() {
  await run_out_mq(action_worker_storage, action_worker_queue, handle_msg)
}

async function handle_msg(bot, msg) {
  const {match, message} = msg
  logger.debug(msg, message, message.entities)
  if (!match || match.length === 0) {
    logger.debug(`Match is empty, ignore`)
    return
  }
  // add to pic_add_queue
  const chat_id = message.chat.id
  // action 事件可能从 worker 触发, message id 无意义
  const message_id = undefined
  let action = match[0].replace(done_arr_end, '')
  if (action.startsWith(taskLimit.sub_prefix.markup.cb)) {
    action = await HGET(action, taskLimit.sub_prefix.markup.cb)
  }
  // tags -> subscribe
  const magic = 'http'
  if (action.startsWith(magic)) {
    let s = `#订阅\n${action}`
    await redis_add_sub(action, chat_id)
    return send_text(chat_id, s)
  }
  // forward to channel
  if (ids.forwardId) {
    await handle_429(forward_channel, message)
  }
  const urls = message_decode(message, action)
  if (urls.length === 0) {
    logger.debug(`No url in message: ${JSON.stringify(message)}`)
    return
  }
  const session = {
    curr: 'pic',
    pic: {mode: 'download'},
    sub: {mode: 'init', urls: []},
    opts: {img_or_tags: action},
  }
  const v = {chat_id, message_id, session, urls}
  logger.debug(`Add to pic_add_queue: ${JSON.stringify(v)}`)
  await pic_add_storage.rpush(v)
  eventBus.emit(pic_add_event, v)
}

async function forward_channel(message) {
  // const fromChatId = message.chat.id
  // const msgId = message.chat.id
  // await bot.forwardMessage(ids.forwardId, chat_id, message_id, {disable_notification: true})
  const opts = {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  }
  const text = rebuildTextMsg(message)
  return subBot.telegram.sendMessage(ids.forwardId, text, opts)
}

function rebuildTextMsg(message) {
  const text = message.text || message.caption
  const entities = message.entities || message.caption_entities
  if (!entities || entities.length === 0) {
    return text
  }
  let newText = ''
  let url_text = ''
  let lastEnd = 0
  for (const entity of entities) {
    const {offset, length, type} = entity
    if (type === 'text_link') {
      newText += text.substring(lastEnd, offset)
      url_text = text.substring(offset, offset + length)
      newText += `[${url_text}](${entity.url})`
      lastEnd = offset + length
    }
  }
  newText += text.substring(lastEnd)
  return newText
}
