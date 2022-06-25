'use strict'
const fs = require('fs'),
    path = require('path')

const {session} = require('telegraf'),
    {ADMIN_ID, clip} = require('./config/config'),
    {logger, loggerMiddleware} = require('./middlewares/logger'),
    clean = require('./services/download/clean'),
    bot = require("./libs/telegram_bot")

const photo = require('./services/download/photo'),
    telegram_msg_sender = require('./services/senders/telegram_msg_sender')

// bot commands
async function main() {
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
            return photo.handle_ctx(ctx)
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
    return bot.telegram.sendMessage(ADMIN_ID, stopped)
        .then(_ => photo.stop())
        .then(_ => telegram_msg_sender.stop())
        .then(_ => bot.stop())
        .finally(_ => {
            process.exit(0)
        })
}

// Error Handling
Promise.resolve()
    .then(_ => telegram_msg_sender.start())
    .then(_ => photo.start())
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
        return bot.telegram.sendMessage(ADMIN_ID, started)
    })
    .catch(err => {
        logger.error(err)
    })