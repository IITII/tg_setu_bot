/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'
const {queueName, eventName} = require('../../config/config'),
  eventBus = require('../../libs/event_bus'),
  Storage = require('../../libs/storage'),
  queue = queueName.msg_send,
  event = eventName.msg_send,
  storage = new Storage(queue)

const {run_out_mq} = require('./mq_utils')
const {TypeEnum, handle_text, handle_photo, handle_media_group, handle_del_file} = require('../utils/msg_utils')
const {sleep} = require('../../libs/utils')


async function start() {
  eventBus.on(event, consume)
  eventBus.emit(event, 'start')
}

async function consume() {
  await run_out_mq(storage, queue, handle_queue)
}

async function handle_queue(bot, msg) {
  return await handle_429(msg)
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
}
