/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'
const uidMap = new Map(),
  {taskName, taskLimit} = require('../../config/config'),
  taskKey = taskName.eveTask,
  {message_decode, log_url_texts} = require('../utils/service_utils'),
  {send_text} = require('../utils/msg_utils'),
  {HGETALL, get_random_next, HSET, add_sub} = require('./redis_utils'),
  {format_date} = require('../../libs/utils')
const EveiraTags = require('../../libs/download/sites/eveira_tags'),
  eveiraTags = new EveiraTags()

async function task() {
  const all = await HGETALL(taskKey)
  for (const url in all) {
    const info = all[url]
    if (info.nextTime < Date.now()) {
      const {title, imgs, original, cost} = await eveiraTags.getTagUrls(url)
      if (imgs && imgs.length > 0) {
        let index = imgs.length
        info.latest.forEach(u => {
          index = Math.min(index, imgs.findIndex(_ => _.url === u))
        })
        const url_texts = imgs.slice(0, index)
        if (url_texts.length > 0) {
          info.latest = url_texts.map(_ => _.url).slice(0, taskLimit.latest)
          const urlTexts = log_url_texts(url_texts),
            text = `#${taskName}:\n#${title}\n${format_date()}\n${urlTexts}`
          for (const uid of info.uid) {
            await send_text(uid, text)
          }
        }
      }
      info.nextTime = get_random_next()
      await HSET(taskKey, url, info)
    }
  }
}

async function start() {
  await test()
  await task()
  setInterval(async () => {
    await task()
  }, 1000 * 60)
}

async function test() {
  const TEST_UID = process.env.ADMIN_ID
  const arr = [
    'https://everia.club/category/cosplay/',
  ]
  arr.forEach(u => {
    add_sub(u, TEST_UID, taskKey)
  })
}

// async function add_sub() {
//
// }

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

module.exports = {
  start,
}