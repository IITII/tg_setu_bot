'use strict'
const fs = require('fs'),
  path = require('path')

const {session} = require('telegraf'),
  {ADMIN_ID, clip} = require('./config/config'),
  TelegramBot = require('./libs/TelegramBot'),
  {logger, loggerMiddleware} = require('./middlewares/logger'),
  clean = require('./services/download/clean')

const photo = require('./services/download/photo')

// bot commands
async function main() {
  const bot = TelegramBot
  bot.use(session())
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
      return photo(ctx)
    } else {
      return ctx.copyMessage(ctx.chat.id, ctx.message.message_id)
    }
  })
  return bot
}

// Error Handling
main()
  .then(bot => {
    function lis_err(err) {
      logger.error(err)
      if (err.message && err.message.includes('Bot stopped')) {
        process.exit(0)
      }
    }

    function lis_stop() {
      const stopped = `Bot stopped at ${new Date()}`
      logger.info(stopped)
      return bot.telegram.sendMessage(ADMIN_ID, stopped)
        .then(_ => bot.stop())
        .finally(_ => {
          process.exit(0)
        })
    }

    // Enable graceful stop
    process.on('uncaughtException' || 'unhandledRejection', lis_err)
    process.on('SIGINT' || 'SIGTERM', lis_stop)
    return bot.launch().then(_ => bot)
  })
  .then(bot => {
    const started = `Bot started at ${new Date()}`
    logger.info(started)
    return bot.telegram.sendMessage(ADMIN_ID, started)
  })
  .catch(err => {
    logger.error(err)
  })