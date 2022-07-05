/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/07/04
 */
'use strict'
const {Telegraf} = require('telegraf')
const {PROXY} = require('../../config/config')
const HttpsProxyAgent = require('https-proxy-agent')

module.exports = (token => {
 if (!token) {
  throw new Error('token is not defined')
 }
 let bot = new Telegraf(token)
 if (PROXY) {
  const agent = new HttpsProxyAgent(PROXY)
  bot = new Telegraf(token, {
   telegram: {agent},
  })
 }
 return bot
})