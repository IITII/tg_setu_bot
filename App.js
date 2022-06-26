'use strict'

const {ADMIN_ID, clip, db} = require('./config/config'),
  {logger, loggerMiddleware} = require('./middlewares/logger'),
  {clean} = require('./services/msg_utils'),
  bot = require('./libs/telegram_bot')

const LocalSession = require('telegraf-session-local'),
  localSession = new LocalSession(db)
const tgMsgRec = require('./services/runs/TgMsgRec'),
  picHandle = require('./services/runs/PicHandle'),
  msgHandle = require('./services/runs/MsgHandle')

// bot commands
async function main() {
  bot.use(localSession.middleware())
  bot.use(loggerMiddleware)
  bot.start((ctx) => {
    return ctx.reply(`Hello ${ctx.update.message.from.first_name} ${ctx.update.message.from.last_name}`)
  })
  bot.command('unset', async (ctx) => {
    ctx.session = undefined
    return ctx.reply('Review reset')
  })
  bot.command('download', ctx => {
    ctx.session = {review: 1}
    return ctx.reply('Set review to download')
  })
  bot.command('copy', ctx => {
    ctx.session = {review: 2}
    return ctx.reply('Set review to copy')
  })
  bot.command('copydel', ctx => {
    ctx.session = {review: 2}
    ctx.session.del = 1
    return ctx.reply(`Delete temp files/dirs after copy`)
  })
  bot.command('clean', ctx => {
    return clean(bot, ctx.chat.id, clip.baseDir)
  })
  bot.on('message', ctx => {
    if (ctx.session && ctx.session.review > 0) {
      return tgMsgRec(ctx)
    } else {
      return ctx.copyMessage(ctx.chat.id, ctx.message.message_id)
    }
  })
  return bot
}


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
    .then(_ => bot.stop())
    .finally(_ => {
      process.exit(0)
    })
}

// Error Handling
Promise.resolve()
  .then(_ => msgHandle.start())
  .then(_ => picHandle.start())
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