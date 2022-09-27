/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'

const {logger} = require('../../middlewares/logger')
const bot = require('../../libs/telegram_bot')
const busyMap = new Map()

async function run_out_mq(storage, busyKey, handle_queue) {
  if (busyMap.has(busyKey)) {
    return Promise.resolve('busy')
  } else {
    busyMap.set(busyKey, true)
  }
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
  busyMap.delete(busyKey)
}

module.exports = {
  run_out_mq,
}