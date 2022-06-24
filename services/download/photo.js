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
  {uniq, difference} = require('lodash')
const {clip} = require('../../config/config'),
  {currMapLimit, downloadFile, time_human_readable} = require('../../libs/utils'),
  download = require('../../libs/download'),
  bot = require('../../libs/telegram_bot'),
  {logger} = require('../../middlewares/logger'),
  Storage = require('../../libs/storage')
const {send_text, sendMediaGroup, send_del_file} = require("../telegram_msg_sender")

const supported = [
  'https://telegra.ph/',
  'https://everia.club/tag/',
  'https://everia.club/category/',
  'https://everia.club/',
]
const supportHandle = [
  download.dl_tg,
  download.dl_eve_tag,
  download.dl_eve_tag,
  download.dl_eve,
]
const special_url = /^https?:\/\/everia.club\/?$/
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
    const text_link = message.entities
        .filter(_ => _.type === 'text_link')
        .map(_ => _.url)
        .filter(_ => isSupport(_))
    urls = urls.concat(text_link)
    const url = message.entities
        .filter(_ => _.type === 'url')
        .map(os => message.text.substring(os.offset, os.offset + os.length))
        .filter(_ => isSupport(_))
    urls = urls.concat(url)
  }
  urls = uniq(urls.flat(Infinity)).filter(_ => supported.some(s => _.startsWith(s)))
  return urls
}

async function handle_ctx(ctx) {
  const message = ctx.message || ctx.update.message
  const urls = message_decode(message)
  if (urls.length === 0) {
    // const msg = `no url in message: ${JSON.stringify(message)}`
    const msg = `无法解析消息: ${JSON.stringify(message)}`
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
    // const s = `total ${url_add.count} urls added to queue`
    const s = `添加 ${url_add.count} 条链接到队列`
    url_add.count = 0
    ctx.reply(s)
  }, url_add.delay)
}

function handle_sup_url(url) {
  let idx = -1
  if (url.match(special_url)) {
    idx = 1
  } else {
    idx = supported.findIndex(_ => url.startsWith(_))
  }
  if (idx === -1) {
    throw new Error(`No support handle for this url: ${url}`)
  }
  return supportHandle[idx](url)
}

function log_ph(phs) {
  return phs.map(ph => {
    const {title, imgs, original, cost} = ph
    return `[${title}](${original}): ${imgs.length} in ${time_human_readable(cost)}`
  }).join('\n')
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
  let reviewMsg = ""
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
    await downloadImgs(mkHead, imgs)
    if (session && session.review === 2) {
      const need_send = imgs.map(_ => _.savePath).flat(Infinity)
      await sendCopyDel(need_send, title)
    }
    let endMsg = reviewMsg
    if (meta) {
      endMsg += `\n${meta.join(', ')}`
    }
    if (tags) {
      endMsg += `\n${tags.join(', ')}`
    }
    endMsg += `\n\n#MarkAsDone`
    logger.debug(endMsg)
    await send_del_file(chat_id, need_del, endMsg, message_id)
  }
  async function ac_json(json) {
    return downloadFile(json.url, json.savePath, logger)
  }
  async function downloadImgs(dlMsg, imgs,
                              limit = clip.downloadLimit,
                              start = new Date(),
                              handle = ac_json) {
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
    await sendMediaGroup(bot, chat_id, need_send, title)
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
  start,
  stop,
  handle_ctx,
}