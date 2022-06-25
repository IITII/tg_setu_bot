/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/29
 */
'use strict'

const fs = require('fs')
const path = require('path')
const {clip} = require('../../config/config')
const {logger} = require('../../middlewares/logger')
const {send_text} = require('../senders/telegram_msg_sender')

async function clean(bot, chat_id, dir) {
  const rm = fs.rm || fs.rmdir
  rm(dir, {recursive: true}, err => {
    const relative = path.relative(clip.baseDir, dir) || 'Temp'
    let msg = `${relative} dirs/files cleaned`
    if (err) {
      msg = `${relative} dirs/files clean error: ${err.message}`
    }
    logger.info(`chat_id: ${chat_id}, dir: ${dir}, ${msg}`)
    return send_text(chat_id, msg)
  })
}

module.exports = clean