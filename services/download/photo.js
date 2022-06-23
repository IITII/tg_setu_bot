/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/27
 */
'use strict'
const fs = require('fs'),
  path = require('path'),
  eventName = 'add_url',
  EventEmitter = require('events'),
  events = new EventEmitter(),
  {uniq} = require('lodash')
const {clip} = require('../../config/config'),
  {currMapLimit, downloadFile} = require('../../libs/utils'),
  download = require('../../libs/download'),
  bot = require('../../libs/TelegramBot'),
  {logger} = require('../../middlewares/logger'),
  Storage = require('../../libs/storage')
const {send_text, sendMediaGroup, send_del_file} = require("../telegram_msg_sender")

const supported = ['https://telegra.ph/', 'https://everia.club/']
const supportHandle = [download.dl_tg, download.dl_eve]
let busy = false
let firstStart = true
let started = false
const queueName = 'review_queue',
  storage = new Storage(queueName)

const url_add = {
  timer: undefined,
  count: 0,
  delay: 500,
}

async function start() {
  if (started) {
    logger.warn(`${queueName} already started`)
  } else {
    started = true
    firstStart = false
    events.on(eventName, lis_add)
    logger.info(`First start, consume queue ${queueName}`)
    lis_add().then(_ => logger.info(`${queueName} end`))
  }
}


async function stop() {
  started = false
  events.off(eventName, lis_add)
}

async function lis_add() {
  if (busy) {
    return
  }
  busy = true
  let len = await storage.llen()
  while (len > 0) {
    let msg
    let jMsg
    try {
      msg = await storage.lpop()
      if (msg) {
        jMsg = JSON.stringify(msg)
        logger.debug(`handle msg: ${jMsg}`)
        await handle_queue(bot, msg)
      }
      len = await storage.llen()
    } catch (e) {
      logger.error(`Handle ${jMsg} error, ${e.message}`)
      logger.error(e)
    }
  }
  busy = false
}

function isSupport(text) {
  return text && supported.some(_ => text.includes(_))
}

function message_decode(message) {
  let urls = []
  if (isSupport(message.text)) {
    const text = message.text
    urls = urls.concat(text.split('\n').filter(_ => isSupport(_)))
  }
  if (message.entities) {
    const all_u = message.entities
      .filter(_ => _.type === 'text_link')
      .map(_ => _.url)
      .filter(_ => isSupport(_))
    if (all_u.length > 0) {
      urls = urls.concat(all_u)
    }
  }
  urls = uniq(urls).filter(_ => supported.some(s => _.startsWith(s)))
  return urls
}

async function handle_ctx(ctx) {
  const message = ctx.message || ctx.update.message
  const urls = message_decode(message)
  if (urls.length === 0) {
    const msg = `no url in message: ${JSON.stringify(message)}`
    return ctx.reply(msg)
  }
  const v = {
    chat_id: message.chat.id,
    message_id: message.message_id,
    session: ctx.session,
    urls: urls,
  }
  await storage.rpush(v)
  events.emit(eventName, v)
  return debounce(ctx, urls.length)
}

async function debounce(ctx, len) {
  if (url_add.timer) {
    clearTimeout(url_add.timer)
  }
  url_add.count += len
  url_add.timer = setTimeout(() => {
    const s = `total ${url_add.count} urls added to queue`
    url_add.count = 0
    ctx.reply(s)
  }, url_add.delay)
}

function handle_sup_url(url) {
  const idx = supported.findIndex(_ => url.startsWith(_))
  if (idx === -1) {
    throw new Error(`No support handle for this url: ${url}`)
  }
  return supportHandle[idx](url)
}

async function handle_queue(bot, msg) {
  const {chat_id, message_id, session, urls} = msg
  let photos = await currMapLimit(urls, clip.currLimit * 20, handle_sup_url)
  photos = photos.filter(_ => _.imgs.length > 0)

  async function ac_json(json) {
    return downloadFile(json.url, json.savePath, logger)
  }

  for (let i = 0; i < photos.length; i++) {
    const ph = photos[i]
    const {title, imgs, original} = ph
    const start = new Date()
    const s = `${title} download started`
    logger.info(s)
    await send_text(chat_id, s)
    let dlMsg = ''
    await currMapLimit(imgs, clip.currLimit, ac_json)
      .then(_ => {
        const cost = ((new Date() - start) / 1000).toFixed(2)
        dlMsg += `${title} download done, ${imgs.length} in ${cost}s`
        logger.info(dlMsg)
      })
      .catch(e => {
        dlMsg += `${title} download failed, ${e.message}`
        logger.error(dlMsg)
        logger.error(e)
      })
      .finally(async () => {
        dlMsg += `\n${original}`
        return send_text(chat_id, dlMsg, message_id)
      })
    if (session && session.review === 2) {
      const need_send = imgs.map(_ => _.savePath).flat(Infinity)
      let reviewMsg = ''
      await sendMediaGroup(bot, chat_id, need_send, title)
        .then(_ => {
          reviewMsg += `${title} send finished, total: ${need_send.length}`
        })
        .catch(e => {
          reviewMsg += `${title} send failed, ${e.message}`
          logger.error(reviewMsg)
          logger.error(e)
        })
        .finally(async () => {
          let need_del = []
          if (session && session.del === 1) {
            need_del = uniq(need_send.map(_ => path.dirname(_)))
            reviewMsg += `\n${title} clean finished, total: ${need_del.length}`
          }
          logger.debug(reviewMsg)
          reviewMsg += `\n${original}`
          return send_del_file(chat_id, need_del, reviewMsg, message_id)
        })
    }
  }
}

module.exports = {
  start,
  stop,
  handle_ctx,
}