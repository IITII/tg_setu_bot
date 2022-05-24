/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/29
 */
'use strict'

const fs = require('fs')
const {clip} = require('../../config/config')
const path = require('path')

async function clean(bot, chat_id, dir) {
  const rm = fs.rm || fs.rmdir
  rm(dir, {recursive: true}, err => {
    const relative = path.relative(clip.baseDir, dir) || 'Temp'
    let msg = `${relative} dirs/files cleaned`
    if (err) {
      msg = `${relative} dirs/files clean error: ${err.message}`
    }
    return bot.telegram.sendMessage(chat_id, msg)
  })
}

module.exports = clean