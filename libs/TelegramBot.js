/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/03
 */
'use strict'
const {Telegraf} = require('telegraf')
const {BOT_TOKEN, PROXY} = require('../config/config')
const HttpsProxyAgent = require('https-proxy-agent')

module.exports = (() => {
  let bot = new Telegraf(BOT_TOKEN)
  if (PROXY) {
    const agent = new HttpsProxyAgent(PROXY)
    bot = new Telegraf(BOT_TOKEN, {
      telegram: {agent},
    })
  }
  return bot
})()