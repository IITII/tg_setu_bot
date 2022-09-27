/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/07/04
 */
'use strict'
const {Telegraf} = require('telegraf')
const {PROXY} = require('../../config/config')
const HttpsProxyAgent = require('https-proxy-agent')

const botMap = new Map()

module.exports = (token => {
 if (!token) {
  throw new Error('token is not defined')
 }

 if (botMap.has(token)) {
  // 好像没法判断 bot 是否已经停止, 先就这样吧
  return botMap.get(token)
 }
 let bot = new Telegraf(token)
 if (PROXY) {
  const agent = new HttpsProxyAgent(PROXY)
  bot = new Telegraf(token, {
   telegram: {agent},
  })
 }
  botMap.set(token, bot)
 return bot
})