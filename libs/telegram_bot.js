/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/03
 */
'use strict'
const {Telegraf} = require('telegraf')
const {BOT_TOKEN, PROXY} = require('../config/config')
const HttpsProxyAgent = require('https-proxy-agent')

module.exports = (() => {
  if (!BOT_TOKEN) {
    console.log('BOT_TOKEN is not defined')
    process.exit(1)
  }
  let bot = new Telegraf(BOT_TOKEN)
  if (PROXY) {
    const agent = new HttpsProxyAgent(PROXY)
    bot = new Telegraf(BOT_TOKEN, {
      telegram: {agent},
    })
  }
  return bot
})()