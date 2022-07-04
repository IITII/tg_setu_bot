/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/03
 */
'use strict'
const {BOT_TOKEN} = require('../config/config'),
  TelegramBot = require('./bots/TelegramBot')

module.exports = TelegramBot(BOT_TOKEN)