'use strict'

const fs = require('fs')
const path = require("path")
const {timeout, clip} = require('../config/config')
const {maxMediaGroupLength, maxMessageLength} = require('../config/config').telegram

const EventEmitter = require('events'),
    events = new EventEmitter(),
    eventName = 'msg_send'
const queueName = 'telegram_msg_sender',
    Storage = require('../libs/storage'),
    storage = new Storage(queueName),
    {logger} = require("../middlewares/logger"),
    {sendPhoto, getGroupMedia} = require("../libs/media"),
    {sleep, reqRateLimit} = require("../libs/utils")
const bot = require("../libs/telegram_bot"),
    telegram = bot.telegram
const {chunk} = require("lodash")

const TypeEnum = {
    text: 'text',
    photo: 'photo',
    media_group: 'media_group',
    del_file: 'del_file',
}

let busy = false
let firstStart = true
let started = false

async function start() {
    if (started) {
        logger.warn(`${queueName} already started`)
    } else {
        firstStart = false
        started = true
        events.on(eventName, handle_msg)
        logger.info(`First start, consume queue ${queueName}`)
        handle_msg().then(_ => logger.info(`${queueName} end`))
    }
}

async function stop() {
    started = false
    events.off(eventName, handle_msg)
}

async function handle_msg() {
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
                await handle_429(msg)
                    // rate limit
                    .then(_ => sleep(timeout.sendMsg))
            }
            len = await storage.llen()
        } catch (e) {
            logger.error(`Handle ${jMsg} error, ${e.message}`)
            logger.error(e)
        }
    }
    busy = false
}

async function handle_429(msg, retry = 0) {
    const msg_429 = 'Too Many Requests: retry after'
    let res
    try {
        switch (msg.type) {
            case TypeEnum.text:
                res = await handle_text(msg)
                break
            case TypeEnum.photo:
                res = await handle_photo(msg)
                break
            case TypeEnum.media_group:
                res = await handle_media_group(msg)
                break
            case TypeEnum.del_file:
                res = await handle_del_file(msg)
                break
        }
    } catch (e) {
        const eMsg = e.message
        if (eMsg.includes(msg_429)) {
            const index = eMsg.indexOf(msg_429)
            const sleepTimeRaw = eMsg.substring(index + msg_429.length)
            const sleepTime = parseInt(sleepTimeRaw) + 1
            await sleep(sleepTime * 1000)
            if (msg.type === TypeEnum.photo || msg.type === TypeEnum.media_group) {
                if (msg.cap) {
                    msg.cap += `(retry ${retry + 1}`
                }
            }
            return handle_429(msg, retry + 1)
        } else {
            throw e
        }
    }
    return res
}

async function handle_text(msg) {
    let {chat_id, text, message_id} = msg
    text = text.substring(0, maxMessageLength)
    logger.debug(`${chat_id}: ${text}`)
    const opts = message_id ? {
        reply_to_message_id: message_id,
        disable_web_page_preview: true,
        // disable_notification: true,
        // protect_content: true
    } : undefined
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
    text = text.substring(0, maxMessageLength)
    logger.debug(`${chat_id}: ${text}`)
    const opts = message_id ? {
        reply_to_message_id: message_id,
        disable_web_page_preview: true,
        parse_mode: 'Markdown',
        // disable_notification: true,
        // protect_content: true
    } : undefined
    return telegram.sendMessage(chat_id, text, opts)
}

async function send_text(chat_id, text, message_id = undefined) {
    const type = TypeEnum.text
    return storage.rpush({chat_id, type, text, message_id})
        .then(_ => events.emit(eventName, _))
}

async function send_photo(chat_id, sub, cap) {
    const type = TypeEnum.photo
    return storage.rpush({chat_id, type, sub, cap})
        .then(_ => events.emit(eventName, _))
}

async function send_media(chat_id, sub, cap) {
    const type = TypeEnum.media_group
    return storage.rpush({chat_id, type, sub, cap})
        .then(_ => events.emit(eventName, _))
}

async function send_del_file(chat_id, dirs, text, message_id = undefined) {
    const type = TypeEnum.del_file
    return storage.rpush({chat_id, type, dirs, text, message_id})
        .then(_ => events.emit(eventName, _))
}


async function sendMediaGroup(bot, chat_id, urls, captionType = 'filename', showProgress = true) {
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
        .then(_ => events.emit(eventName, _))
}

module.exports = {
    send_text,
    send_photo,
    send_media,
    send_del_file,
    sendMediaGroup,
    start,
    stop,
}