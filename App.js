'use strict'

const {logger} = require('./middlewares/logger'),
  bot = require('./libs/telegram_bot')

const bot_command = require('./bot_command'),
  picHandle = require('./services/handler/PicHandler'),
  actionHandler = require('./services/handler/ActionHandler'),
  msgHandle = require('./services/msg/UserMsgSender'),
  taskRunner = require('./services/tasks/TaskRunner')

// bot commands
async function main() {
  return await bot_command.start(bot).then(_ => bot)
}

/**
 * reset bot commands
 * @see https://github.com/telegraf/telegraf/issues/1589
 * @see https://github.com/jxxghp/MoviePilot/blob/0214beb6798f161623bf294266b1121040e83a41/app/modules/telegram/telegram.py#L216
 */
async function resetBotCommand(bot) {
  const commands = [
    {command: 'search', description: '找点什么?...'},
    {command: 'copy_del', description: '让我康康!!!'},
    {command: 'download', description: '仅下载'},
    {command: 'sub', description: '订阅'},
    {command: 'u_sub', description: '取消订阅'},
    {command: 'exit', description: '尝试重启'},
    {command: 'run', description: '立即扫描'},
  ]
  await bot.telegram.deleteMyCommands()
  return bot.telegram.setMyCommands(commands)
}

// Error Handling
Promise.resolve()
  .then(_ => msgHandle.start())
  .then(_ => picHandle.start())
  .then(_ => actionHandler.start())
  .then(_ => taskRunner.start())
  .then(_ => resetBotCommand(bot))
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
