/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/07/04
 */
'use strict'

const {BOT_TOKEN, tokens, timeout} = require('../../config/config'),
  {logger} = require('../../middlewares/logger'),
  {currMapLimit, sleep, time_human_readable} = require('../../libs/utils'),
  TelegramBot = require('../../libs/bots/TelegramBot.js'),
  mainBot = require('../../libs/telegram_bot.js'),
  picWorkerTokens = [].concat(tokens.picWorkers || []),
  subBot = tokens.subscribe ? TelegramBot(tokens.subscribe) : null
const {
  handle_photo,
  TypeEnum,
  handle_text,
  handle_media_group,
  handle_del_file,
  handle_429, handle_text_msg,
} = require('../utils/msg_utils')
let picWorkers = null

async function start() {
  if (subBot) {
    await subBot.launch().then(() => {
      logger.info(`subscribe bot launched`)
    })
  }
  if (picWorkerTokens.length > 0) {
    let i = 0
    picWorkers = picWorkerTokens.map(t => {
      const name = `picWorker_${i++}`
      const bot = TelegramBot(t)
      const {telegram} = bot
      const busy = false
      return {name, bot, telegram, token: t, busy}
    })
    await Promise.all(picWorkers.map(w => {
      return w.bot.launch().then(() => {
        logger.info(`${w.name} bot launched`)
      })
    })).then(() => {
      logger.info(`pic workers launched: ${picWorkers.length}`)
    })
  }
  return Promise.resolve()
}

async function stop() {
  if (subBot) {
    await subBot.stop()
    logger.info(`subscribe bot stopped`)
  }
  if (picWorkers) {
    await Promise.all(picWorkers.map(async w => {
      let r = await w.bot.stop()
      logger.info(`${w.name} bot stopped`)
      return r
    })).then(() => {
      logger.info(`pic workers stopped: ${picWorkers.length}`)
    })
  }
  return Promise.resolve()
}

// check usage before move to async func
function hasPicBot() {
  return picWorkers && picWorkers.length > 0
}

async function handle_sub(msg) {
  let res
  if (subBot) {
    res = handle_photo(msg, subBot.telegram)
  } else {
    res = handle_photo(msg)
  }
  return res
}

async function handle_429_wrapper(msg) {
  logger.debug(`handle_429_wrapper: ${JSON.stringify(msg)}`)
  return handle_429(msg_common_handle, msg)
}

async function msg_common_handle(msg, tg = mainBot?.telegram) {
  let res
  switch (msg.type) {
    case TypeEnum.TEXT:
      res = await handle_text(msg, tg)
      break
    case TypeEnum.PHOTO:
      res = await handle_photo(msg, tg)
      break
    case TypeEnum.SUBSCRIBE:
      res = await handle_sub(msg)
      break
    case TypeEnum.MEDIA_GROUP:
      res = await handle_media_group(msg, tg)
      break
    case TypeEnum.DEL_FILE:
      res = await handle_del_file(msg, tg)
      break
  }
  return res
}

async function handle_batch_msg(bot, msg) {
  const msgArr = [].concat(msg)
  if (msgArr.length === 0) return
  const msgLen = msgArr.length,
    hasPicBots = hasPicBot(),
    isMediaGroup = msgArr[0].type === TypeEnum.MEDIA_GROUP
  logger.debug(`handle_batch_msg: ${msgLen}, ${isMediaGroup}, ${hasPicBots}`)
  if (msgLen > 1 && isMediaGroup && hasPicBots) {
    logger.debug(`handle_batch_msg: ${JSON.stringify(msgArr[0])}`)
    return await worker_accept(msgArr)
  } else {
    // for (const m of msgArr) {
    //   await handle_429(m)
    //   // 无流控，完全靠 handle429 决定等待时间
    //   await sleep(1000)
    // }
    logger.debug(`handle_429_wrapper: ${JSON.stringify(msgArr[0])}`)
    return await currMapLimit(msgArr, 1, handle_429_wrapper)
  }

}

async function worker_accept(msgArr) {
  let idx = picWorkers.findIndex(w => !w.busy)
  if (idx > -1) {
    const worker = picWorkers[idx]
    logger.debug(`worker ${worker.name} handle: ${JSON.stringify(msgArr[0])}`)
    const chat_id = msgArr[0].chat_id
    let start = Date.now(),
      handleMsg = ''
    handle_chat_not_found(worker.name, chat_id, worker_handle, idx, msgArr)
      .then(() => {
        handleMsg = `worker ${worker.name} handled`
      }).catch(e => {
      handleMsg = `worker ${worker.name} handle error: ${e.message}`
      logger.error(e)
    }).finally(() => {
      handleMsg += `, cost: ${time_human_readable(Date.now() - start)}`
      logger.debug(handleMsg)
    })
  } else {
    const sleepTime = timeout.checkWorker
    logger.debug(`no worker available, try again after ${sleepTime}ms`)
    await sleep(sleepTime)
    return worker_accept(msgArr)
  }
}

async function handle_chat_not_found(prefix, chat_id, handle, ...args) {
  let res = Promise.resolve()
  try {
    res = await handle(...args)
  } catch (e) {
    if (e.message.toLowerCase().includes('chat not found')) {
      const msg = `${prefix} chat not found, plz chat with bot first`
      logger.error(msg)
      await handle_text_msg(chat_id, msg, undefined, undefined, '\n', mainBot.telegram)
    } else {
      throw e
    }
  }
  return res
}

async function worker_handle(i, msgArr) {
  picWorkers[i].busy = true
  try {
    async function msg_handle(msg) {
      const worker = picWorkers[i]
      // 其他 worker 可没上下文，所以不能reply msg id
      if (worker.token !== BOT_TOKEN) {
        delete msg.message_id
      }
      return msg_common_handle(msg, picWorkers[i].telegram)
    }

    async function worker_429_wrapper(msg) {
      return handle_429(msg_handle, msg)
        .catch(e => {
          logger.error(`worker ${picWorkers[i].name} handle error: ${e.message}`, msg, e)
        })
    }

    return await currMapLimit(msgArr, 1, worker_429_wrapper)
  } finally {
    picWorkers[i].busy = false
  }
}

module.exports = {
  start,
  stop,
  handle_batch_msg,
}
