'use strict'

const {logger} = require('./middlewares/logger'),
  bot = require('./libs/telegram_bot')

const bot_command = require('./bot_command'),
  picHandle = require('./services/runs/PicHandle'),
  msgHandle = require('./services/runs/MsgHandle'),
  taskRunner = require('./services/runs/TaskRunner')

// bot commands
async function main() {
  return await bot_command(bot).then(_ => bot)
}

// Error Handling
Promise.resolve()
  .then(_ => msgHandle.start())
  .then(_ => picHandle.start())
  .then(_ => taskRunner.start())
  .then(_ => main())
  .then(_ => {
    // Enable graceful stop
    process.on('uncaughtException' || 'unhandledRejection', lis_err)
    process.on('SIGINT' || 'SIGTERM', lis_stop)
    return bot.launch()
  })
  .then(_ => {
    const started = `Bot started at ${new Date()}`
    logger.info(started)
    // return bot.telegram.sendMessage(ADMIN_ID, started)
  })
  .catch(err => {
    logger.error(err)
  })

function lis_err(err) {
  logger.error(err)
  const exitArr = [
    'Bot stopped',
    '409: Conflict: terminated by other getUpdates request',
  ]
  if (err.message && exitArr.some(_ => err.message.includes(_))) {
    process.exit(0)
  }
}

function lis_stop() {
  const stopped = `Bot stopped at ${new Date()}`
  logger.info(stopped)
  return Promise.resolve()
    // .then(_ => bot.telegram.sendMessage(ADMIN_ID, stopped))
    // .then(_ => telegram_msg_sender.stop())
    .then(_ => msgHandle.stop())
    .then(_ => bot.stop())
    .finally(_ => {
      process.exit(0)
    })
}
