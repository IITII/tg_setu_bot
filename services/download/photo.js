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
const {clip, telegram} = require('../../config/config'),
    {currMapLimit, downloadFile, sleep} = require('../../libs/utils'),
    download = require('../../libs/download'),
    bot = require('../../libs/TelegramBot'),
    {logger} = require('../../middlewares/logger'),
    {sendMediaGroup} = require('../../libs/media'),
    Storage = require('../../libs/storage'),
    clean = require('./clean')
const {send_text} = require("../telegram_msg_sender");

const supported = ['https://telegra.ph/']
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
        try {
            msg = await storage.lpop()
            await handle_queue(bot, msg.chat_id, msg.session, msg.urls)
            len = await storage.llen()
        } catch (e) {
            logger.error(`Handle ${msg} error, ${e.message}`)
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
    urls = uniq(urls).filter(_ => _.startsWith(supported[0]))
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

async function handle_queue(bot, chat_id, session, urls) {
    let photos = await currMapLimit(urls, clip.currLimit * 20, download.dl_tg)
    photos = photos.filter(_ => _.imgs.length > 0)

    async function ac_json(json) {
        return downloadFile(json.url, json.savePath, logger)
    }

    for (let i = 0; i < photos.length; i++) {
        const ph = photos[i]
        const title = ph.title
        const start = new Date()
        const s = `${title} download started`
        logger.info(s)
        await send_text(chat_id, s)
        await currMapLimit(ph.imgs, clip.currLimit, ac_json)
            .then(_ => {
                const s = `${title} download done, ${ph.imgs.length} in ${((new Date() - start) / 1000).toFixed(2)}s`
                logger.info(s)
                return send_text(chat_id, s)
            })
            .catch(e => {
                const s = `${title} download failed, ${e.message}`
                logger.error(s)
                send_text(chat_id, s)
                logger.error(e)
            })
        if (session && session.review === 2) {
            const need_send = ph.imgs.map(_ => _.savePath).flat(Infinity)
            await sendMediaGroup(bot, chat_id, need_send, title)
                // .then(_ => {
                //   const s = `${title} send finished, total: ${need_send.length}, failed: ${_.length}, ${JSON.stringify(_)}`.substring(0, telegram.maxMessageLength)
                //   return bot.telegram.sendMessage(chat_id, s)
                // })
                .then(async _ => {
                    // await sleep(1500)
                    return _
                })
                .catch(e => {
                    logger.error(e)
                })
                .finally(async () => {
                    let msg = `${title} send finished, total: ${need_send.length}`
                    if (session && session.del === 1) {
                        const need_del = uniq(need_send.map(_ => path.dirname(_)))
                        await Promise.allSettled(need_del.map(_ => clean(bot, chat_id, _)))
                            .then(_ => {
                                const failed = _.filter(_ => _.status === 'rejected').map(_ => _.reason.message)
                                msg += `\n${title} clean finished, total: ${need_del.length}, failed: ${failed.length}, ${JSON.stringify(failed)}`
                                msg = msg.substring(0, telegram.maxMessageLength)
                            })
                    }
                    logger.info(msg)
                    return send_text(chat_id, msg)
                })
        }
    }
}

module.exports = {
    start,
    stop,
    handle_ctx,
}