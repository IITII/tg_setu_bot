'use strict'

const {timeout} = require('../config/config')
const {maxMediaGroupLength} = require('../config/config').telegram

const EventEmitter = require('events'),
    events = new EventEmitter(),
    eventName = 'msg_send'
const queueName = 'telegram_msg_sender',
    Storage = require('../libs/storage'),
    storage = new Storage(queueName),
    {logger} = require("../middlewares/logger"),
    {sendPhoto, getGroupMedia} = require("../libs/media"),
    {sleep, reqRateLimit} = require("../libs/utils")
const bot = require("../libs/TelegramBot"),
    telegram = bot.telegram
const {chunk} = require("lodash");

const TypeEnum = {
    text: 'text',
    photo: 'photo',
    media_group: 'media_group',
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
        try {
            msg = await storage.lpop()
            logger.debug(`handle msg: ${JSON.stringify(msg)}`)
            await handle_429(msg)
                // rate limit
                .then(_ => sleep(timeout.sendMsg))
            len = await storage.llen()
        } catch (e) {
            logger.error(`Handle ${msg} error, ${e.message}`)
            logger.error(e)
        }
    }
    busy = false
}

async function handle_429(msg) {
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
        }
    } catch (e) {
        const eMsg = e.message
        if (eMsg.includes(msg_429)) {
            const index = eMsg.indexOf(msg_429)
            const sleepTimeRaw = eMsg.substring(index + msg_429.length)
            const sleepTime = parseInt(sleepTimeRaw) + 1
            await sleep(sleepTime * 1000)
            return handle_429(eMsg)
        } else {
            throw e
        }
    }
    return res
}

async function handle_text(msg) {
    const {chat_id, text} = msg
    return telegram.sendMessage(chat_id, text)
        .then(_ => events.emit(eventName, _))
}

async function handle_photo(msg) {
    const {chat_id, sub, cap} = msg
    return telegram.sendPhoto(chat_id, sendPhoto(sub, cap))
        .then(_ => events.emit(eventName, _))
}

async function handle_media_group(msg) {
    const {chat_id, sub, cap} = msg
    return telegram.sendMediaGroup(chat_id, getGroupMedia(sub, cap))
        .then(_ => events.emit(eventName, _))
}

async function send_text(chat_id, text) {
    const type = TypeEnum.text
    return storage.rpush({chat_id, type, text})
}

async function send_media(chat_id, sub, cap) {
    const type = TypeEnum.media_group
    return storage.rpush({chat_id, type, sub, cap})
}

async function send_photo(chat_id, sub, cap) {
    const type = TypeEnum.photo
    return storage.rpush({chat_id, type, sub, cap})
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
            res = send_photo(chat_id, sub, cap)
        }
        return res
    }
    const grouped = chunk(urls, maxMediaGroupLength)
    // 线性处理
    return reqRateLimit(func, grouped, 1, false)
}

module.exports = {
    send_text,
    send_photo,
    send_media,
    sendMediaGroup,
    start,
    stop,
}