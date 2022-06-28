/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'
const {taskName, taskLimit} = require('../../config/config'),
  {log_url_texts} = require('../utils/service_utils'),
  {send_text} = require('../utils/msg_utils'),
  {get_random_next, HSET} = require('./redis_utils'),
  {format_date, time_human_readable} = require('../../libs/utils')
const EveiraTags = require('../../libs/download/sites/eveira_tags'),
  eveiraTags = new EveiraTags()

async function task(url, info, breakTime, start = format_date()) {
  const {title, imgs, cost} = await eveiraTags.getTagUrls(url),
    spent = time_human_readable(cost)
  if (imgs && imgs.length > 0) {
    let index = imgs.length
    info.latest.forEach(u => {
      index = Math.min(index, imgs.findIndex(_ => _.url === u))
    })
    const url_texts = imgs.slice(0, index)
    if (url_texts.length > 0) {
      info.latest = url_texts.map(_ => _.url).slice(0, taskLimit.latest)
      const urlTexts = log_url_texts(url_texts)
      let text = `#${taskName} #${title}\n`
      text += `Start: ${start}\n`
      text += `Spent: ${spent}\n`
      text += `${urlTexts}`
      for (const uid of info.uid) {
        await send_text(uid, text)
      }
    }
  }
  info.nextTime = get_random_next(breakTime)
  await HSET(url, info)
}

module.exports = {
  task,
}