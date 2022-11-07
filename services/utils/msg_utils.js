/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'

const fs = require('fs'),
  path = require('path'),
  {Markup} = require('telegraf'),
  {chunk} = require('lodash')

const {queueName, eventName} = require('../../config/config'),
  eventBus = require('../../libs/event_bus'),
  Storage = require('../../libs/storage'),
  action_worker_queue = queueName.action_worker,
  action_worker_event = eventName.action_worker,
  action_worker_storage = new Storage(action_worker_queue),
  queue = queueName.msg_send,
  event = eventName.msg_send,
  storage = new Storage(queue)
const {clip, telegram: telegramConf} = require('../../config/config'),
  {maxMediaGroupLength, maxMessageLength} = telegramConf,
  {logger} = require('../../middlewares/logger'),
  {sendPhoto, getGroupMedia} = require('../../libs/media'),
  {reqRateLimit, sleep} = require('../../libs/utils'),
  bot = require('../../libs/telegram_bot'),
  telegram = bot.telegram

const TypeEnum = {
  TEXT: 'text',
  MARK_AS_DONE: 'mark_as_done',
  PHOTO: 'photo',
  MEDIA_GROUP: 'media_group',
  DEL_FILE: 'del_file',
  SUBSCRIBE: 'subscribe',
}

const default_session = {
  // init, pic, sub
  curr: 'init',
  pic: {
    // init, download, copy
    mode: 'init',
  },
  sub: {
    // add, remove
    mode: 'init',
    /**
     * @deprecated due to session bugs
     */
    urls: [],
  },
  opts: {
    // img, tags, mix
    img_or_tags: 'img',
  },
}
const img_or_tags_arr = [
  ['只要图', 'img'],
  ['只要Tag', 'tags'],
  ['我全都要', 'mix'],
]
const done_arr_end = '_done'
const done_arr = img_or_tags_arr.map(([v1, v2]) => [v1, `${v2}${done_arr_end}`])

function emit(v, eve = event) {
  return eventBus.emit(eve, v)
}

async function send_text(chat_id, text, message_id = undefined, preview = false, parse_mode = undefined) {
  const msg = getTextMsg(chat_id, text, message_id, preview, parse_mode)
  return storage.rpush(msg).then(_ => emit(_))
}

function getTextMsg(chat_id, text, message_id = undefined, preview = false, parse_mode = undefined) {
  const type = TypeEnum.TEXT
  return [{chat_id, type, text, message_id, preview, parse_mode}]
}

// async function send_done_text(chat_id, text, tags = undefined, message_id = undefined, preview = false, parse_mode = undefined) {
//   const msg = getDoneTextMsg(chat_id, text, tags, message_id, preview, parse_mode)
//   return storage.rpush(msg).then(_ => emit(_))
// }

function getDoneTextMsg(chat_id, text, tags = undefined, message_id = undefined, preview = false, parse_mode = undefined) {
  const type = TypeEnum.MARK_AS_DONE
  return [{chat_id, type, text, tags, message_id, preview, parse_mode}]
}

async function send_photo(chat_id, sub, cap, isSub = false) {
  const msg = getPhotoMsg(chat_id, sub, cap, isSub)
  return storage.rpush(msg).then(_ => emit(_))
}

function getPhotoMsg(chat_id, sub, cap, isSub = false) {
  const type = isSub ? TypeEnum.SUBSCRIBE : TypeEnum.PHOTO
  return [{chat_id, type, sub, cap}]
}

async function send_media(chat_id, sub, cap) {
  const type = TypeEnum.MEDIA_GROUP
  return storage.rpush([{chat_id, type, sub, cap}])
    .then(_ => emit(_))
}

async function send_del_file(chat_id, dirs, text, message_id = undefined, preview = false) {
  const type = TypeEnum.DEL_FILE
  return storage.rpush([{chat_id, type, dirs, text, message_id, preview}])
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

function getMediaGroupMsg(chat_id, urls, captionType = 'filename', showProgress = true) {
  if (!Array.isArray(urls)) {
    urls = [].concat(urls)
  }
  let {cur, total} = {cur: 0, total: urls.length}
  const grouped = chunk(urls, maxMediaGroupLength)
  const type = TypeEnum.MEDIA_GROUP
  return grouped.map(sub => {
    cur += sub.length
    let cap = captionType
    if (showProgress) {
      cap = `${captionType} ${cur}/${total}`
    }
    let g = {chat_id, type, sub, cap}
    if (sub.length === 1) {
      g = getPhotoMsg(chat_id, sub[0], cap)
    }
    return g
  }).flat(Infinity)
}

async function sendBatchMsg(msgArr) {
  if (!(msgArr && msgArr.length > 0)) return
  msgArr = [].concat(msgArr)
  return storage.rpush(msgArr).then(_ => emit(_))
}

async function handle_text(msg, tg = telegram) {
  let {chat_id, text, message_id, preview, parse_mode} = msg
  return handle_text_msg(chat_id, text, message_id, preview, '\n', tg, parse_mode)
}

async function handle_done_text(msg, tg = telegram) {
  let {chat_id, text, tags, message_id, preview, parse_mode} = msg
  const opts = {
    reply_to_message_id: message_id,
    parse_mode: parse_mode === undefined ? 'Markdown' : parse_mode,
    // disable_notification: true,
    // protect_content: true,
    ...Markup.inlineKeyboard([
      done_arr.map(([hint, t]) => {
        return Markup.button.callback(hint, t)
      }),
      tags.map(({text, url}) => {
        return Markup.button.callback(`订阅: ${text}`, url)
      }),
    ]),
  }
  opts.disable_web_page_preview = !preview
  return tg.sendMessage(chat_id, text, opts)
}

async function clean(chat_id, dir) {
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

async function handle_del_file(msg, tg = telegram) {
  let {chat_id, dirs, text, message_id, preview} = msg
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
  return handle_text_msg(chat_id, text, message_id, preview, '\n', tg)
}

async function handle_text_msg(chat_id, text, message_id, preview, sep = '\n', tg = telegram, parse_mode = undefined) {
  if (text.length > maxMessageLength) {
    const split = text.split(sep)
    const rawText = []
    let len = 0
    let tmp = []
    for (let t of split) {
      if (t > maxMessageLength) {
        t = t.substring(0, maxMessageLength)
      }
      if (len + t.length + sep.length > maxMessageLength) {
        rawText.push(JSON.parse(JSON.stringify(tmp)).join(sep))
        tmp = [t]
        len = t.length + sep.length
      } else {
        tmp.push(t)
        len += t.length + sep.length
      }
    }
    rawText.push(JSON.parse(JSON.stringify(tmp)).join(sep))
    for (let t of rawText) {
      logger.debug(`${chat_id}: split ${text.length} to ${rawText.length}`)
      await send_text(chat_id, t, message_id, preview, parse_mode)
    }
  } else {
    logger.debug(`${chat_id}: ${text}`)
    const opts = {
      reply_to_message_id: message_id,
      parse_mode: parse_mode === undefined ? 'Markdown' : parse_mode,
      // disable_notification: true,
      // protect_content: true
    }
    opts.disable_web_page_preview = !preview
    return tg.sendMessage(chat_id, text, opts)
  }
}

async function handle_photo(msg, tg = telegram) {
  const {chat_id, sub, cap} = msg
  return tg.sendPhoto(chat_id, sendPhoto(sub), {
    caption: cap,
    parse_mode: 'Markdown',
  })
}

async function handle_media_group(msg, tg = telegram) {
  const {chat_id, sub, cap} = msg
  const medias = getGroupMedia(sub, cap)
  return tg.sendMediaGroup(chat_id, medias)
}


async function handle_429(handle, msg, retry = 0) {
  const msg_429 = 'Too Many Requests: retry after'
  let res
  try {
    res = await handle(msg)
  } catch (e) {
    const eMsg = e.message
    if (eMsg.includes(msg_429)) {
      const index = eMsg.indexOf(msg_429)
      const sleepTimeRaw = eMsg.substring(index + msg_429.length)
      const sleepTime = parseInt(sleepTimeRaw) + 1
      const retryMsg = `retry ${retry + 1} after ${sleepTime}s`
      logger.warn(`${msg.chat_id || ''}: ${retryMsg}`)
      await sleep(sleepTime * 1000)
      if (msg.type === TypeEnum.PHOTO || msg.type === TypeEnum.MEDIA_GROUP) {
        if (msg.cap) {
          msg.cap += `(${retryMsg}`
        }
      }
      return handle_429(handle, msg, retry + 1)
    } else {
      throw e
    }
  }
  return res
}

async function send_action(json) {
  return action_worker_storage.rpush(json).then(_ => emit(_, action_worker_event))
}

module.exports = {
  TypeEnum,
  default_session,
  img_or_tags_arr,
  done_arr,
  done_arr_end,
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
  sendBatchMsg,
  getTextMsg,
  getPhotoMsg,
  getMediaGroupMsg,
  handle_429,
  send_action,
  // send_done_text,
  getDoneTextMsg,
  handle_done_text,
}
