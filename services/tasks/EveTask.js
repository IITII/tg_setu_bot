/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'
const redis = require('redis'),
  {taskName} = require('../../config/config'),
  taskKey = taskName.eveTask,
  {get_dom} = require('../../libs/download/dl_utils')
const uidMap = new Map()
const {message_decode} = require('../service_utils')
const {send_text} = require('../msg_utils')

async function test() {
  const TEST_UID = process.env.TEST_UID || 'TEST_UID'
  const arr = [
    'https://everia.club/category/cosplay/',
  ]
  arr.forEach(u => {
    add_sub(u, TEST_UID, taskKey)
  })
}

async function add_sub() {

}

async function remove_sub() {

}

function handle_add_start(ctx) {
  const message = ctx.message || ctx.update.message
  const urls = message_decode(ctx)
  const uid = ctx.from.id
  const chat_id = message.chat.id
  if (urls.length > 0) {
    let info
    if (uidMap.has(uid)) {
      info = uidMap.get(uid)
      info = info.concat(urls)
    } else {
      info = urls
    }
    uidMap.set(uid, info)
  }
  // return send_text(chat_id, )
}

function handle_add_end() {

}