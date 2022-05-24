'use strict'
const Telegraf = require('telegraf'),
    HttpsProxyAgent = require('https-proxy-agent'),
    session = require('telegraf/session'),
    { logger, loggerMiddleware } = require('./middlewares/logger'),
    BOT_TOKEN = process.env.BOT_TOKEN,
    PROXY = process.env.PROXY


async function main() {
    let bot = new Telegraf(BOT_TOKEN)
    if (PROXY) {
        bot = new Telegraf(BOT_TOKEN, {
            telegram: { agent }
        })
    }
}