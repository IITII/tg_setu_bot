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

const {run_out_mq} = require('../utils/mq_utils'),
  {logger} = require('../../middlewares/logger'),
  multiBotHandle = require('./UserMsgSenders')


async function start() {
  await multiBotHandle.start().then(() => {
    logger.info('MultiBotHandle start')
  })
  eventBus.on(event, consume)
  eventBus.emit(event, 'start')
}

async function stop() {
  await multiBotHandle.stop().then(() => {
    logger.info('MultiBotHandle stop')
  }).catch(e => {
    logger.error(e)
  }).finally(() => {
    // eventBus.removeListener(event, consume)
    // eventBus.emit(event, 'stop')
  })
}

async function consume() {
  await run_out_mq(storage, queue, multiBotHandle.handle_batch_msg)
}

module.exports = {
  start,
  stop,
}
