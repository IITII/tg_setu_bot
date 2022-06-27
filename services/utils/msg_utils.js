/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'

const TypeEnum = {
  TEXT: 'text',
  PHOTO: 'photo',
  MEDIA_GROUP: 'media_group',
  DEL_FILE: 'del_file',
}

module.exports = {
  TypeEnum,
  send_text,
  send_photo,
  send_media,
  send_del_file,
  clean,
  sendMediaGroup,
  handle_text,
  handle_del_file,
  handle_text_msg,
  handle_photo,
  handle_media_group,
}

const fs = require('fs'),
  path = require('path'),
  {chunk} = require('lodash')

const {queueName, eventName} = require('../../config/config'),
  eventBus = require('../../libs/event_bus'),
  Storage = require('../../libs/storage'),
  queue = queueName.msg_send,
  event = eventName.msg_send,
  storage = new Storage(queue)
const {clip, telegram: telegramConf} = require('../../config/config'),
  {maxMediaGroupLength, maxMessageLength} = telegramConf,
  {logger} = require('../../middlewares/logger'),
  {sendPhoto, getGroupMedia} = require('../../libs/media'),
  {reqRateLimit} = require('../../libs/utils'),
  bot = require('../../libs/telegram_bot'),
  telegram = bot.telegram

function emit(v) {
  return eventBus.emit(event, v)
}

async function send_text(chat_id, text, message_id = undefined) {
  const type = TypeEnum.TEXT
  return storage.rpush({chat_id, type, text, message_id})
    .then(_ => emit(_))
}

async function send_photo(chat_id, sub, cap) {
  const type = TypeEnum.PHOTO
  return storage.rpush({chat_id, type, sub, cap})
    .then(_ => emit(_))
}

async function send_media(chat_id, sub, cap) {
  const type = TypeEnum.MEDIA_GROUP
  return storage.rpush({chat_id, type, sub, cap})
    .then(_ => emit(_))
}

async function send_del_file(chat_id, dirs, text, message_id = undefined) {
  const type = TypeEnum.DEL_FILE
  return storage.rpush({chat_id, type, dirs, text, message_id})
    .then(_ => emit(_))
}


async function sendMediaGroup(chat_id, urls, captionType = 'filename', showProgress = true) {
  if (!Array.isArray(urls)) {
    urls = [].concat(urls)
  }
  let {cur, total} = {cur: 0, total: urls.length}

  async function func(sub) {
    let res
    cur += sub.length
    let cap = captionType
    if (showProgress) {
      cap = `${captionType} ${cur}/${total}`
    }
    if (sub.length > 1) {
      res = send_media(chat_id, sub, cap)
    } else {
      res = send_photo(chat_id, sub[0], cap)
    }
    return res
  }

  const grouped = chunk(urls, maxMediaGroupLength)
  // 线性处理
  return reqRateLimit(func, grouped, 1, false)
    .then(_ => emit(_))
}


async function handle_text(msg) {
  let {chat_id, text, message_id} = msg
  return handle_text_msg(chat_id, text, message_id)
}

async function handle_del_file(msg) {
  let {chat_id, dirs, text, message_id} = msg
  const rm = fs.rm || fs.rmdir
  dirs.forEach(dir => {
    rm(dir, {recursive: true}, err => {
      const relative = path.relative(clip.baseDir, dir) || 'Temp'
      let msg = `${relative} dirs/files cleaned`
      if (err) {
        msg = `${relative} dirs/files clean error: ${err.message}`
      }
      logger.info(`chat_id: ${chat_id}, dir: ${dir}, ${msg}`)
      text += `\n${text}`
    })
  })
  return handle_text_msg(chat_id, text, message_id)
}

async function clean(bot, chat_id, dir) {
  const rm = fs.rm || fs.rmdir
  rm(dir, {recursive: true}, err => {
    const relative = path.relative(clip.baseDir, dir) || 'Temp'
    let msg = `${relative} dirs/files cleaned`
    if (err) {
      msg = `${relative} dirs/files clean error: ${err.message}`
    }
    logger.info(`chat_id: ${chat_id}, dir: ${dir}, ${msg}`)
    return send_text(chat_id, msg)
  })
}

async function handle_text_msg(chat_id, text, message_id) {
  text = text.substring(0, maxMessageLength)
  logger.debug(`${chat_id}: ${text}`)
  const opts = {
    reply_to_message_id: message_id,
    disable_web_page_preview: true,
    parse_mode: 'Markdown',
    // disable_notification: true,
    // protect_content: true
  }
  return telegram.sendMessage(chat_id, text, opts)
}

async function handle_photo(msg) {
  const {chat_id, sub, cap} = msg
  return telegram.sendPhoto(chat_id, sendPhoto(sub, cap))
}

async function handle_media_group(msg) {
  const {chat_id, sub, cap} = msg
  return telegram.sendMediaGroup(chat_id, getGroupMedia(sub, cap))
}