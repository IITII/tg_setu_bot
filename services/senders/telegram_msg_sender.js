'use strict'

const {timeout, eventName, queueName} = require('../../config/config')

const eventBus = require('../../libs/event_bus')
const Storage = require('../../libs/storage'),
  storage = new Storage(queueName.msg_send),
  {logger} = require('../../middlewares/logger'),
  {sleep} = require('../../libs/utils')
const {handle_photo, handle_media_group, handle_del_file, handle_text, TypeEnum} = require('../msg_utils')

let busy = false
let firstStart = true
let started = false

async function start() {
  if (started) {
    logger.warn(`${queueName.msg_send} already started`)
  } else {
    firstStart = false
    started = true
    eventBus.on(eventName.msg_send, handle_msg)
    logger.info(`First start, consume queue ${queueName.msg_send}`)
    handle_msg().then(_ => logger.info(`${queueName.msg_send} end`))
  }
}

async function stop() {
  started = false
  eventBus.off(eventName.msg_send, handle_msg)
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
      case TypeEnum.TEXT:
        res = await handle_text(msg)
        break
      case TypeEnum.PHOTO:
        res = await handle_photo(msg)
        break
      case TypeEnum.MEDIA_GROUP:
        res = await handle_media_group(msg)
        break
      case TypeEnum.DEL_FILE:
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
      if (msg.type === TypeEnum.PHOTO || msg.type === TypeEnum.MEDIA_GROUP) {
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

module.exports = {
  start,
  stop,
}