/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/28
 */
'use strict'

const {uniq} = require('lodash'),
  {check, taskName, taskLimit} = require('../../config/config'),
  {format_date, time_human_readable} = require('../../libs/utils'),
  {log_url_texts} = require('../utils/service_utils'),
  {getIndexByUrl} = require('../utils/support_urls_utils'),
  {send_text} = require('../utils/msg_utils'),
  {get_random_next, HSET, HGETALL} = require('../tasks/redis_utils')
const EveiraTags = require('../../libs/download/sites/EveiraTags'),
  Fa24Tags = require('../../libs/download/sites/Fa24Tags'),
  fa24c49 = require('../../libs/download/sites/Fa24C49'),
  junMeiTags = require('../../libs/download/sites/JunMeiTags'),
  eveiraTags = new EveiraTags(),
  fa24Tags = new Fa24Tags()

const supRaw = [
    [
      'https://everia.club/tag/',
      'https://everia.club/category/',
    ],
    [
      'https://www.24fa.com/search.aspx',
      'https://www.268w.cc/search.aspx',
      'https://www.116w.cc/search.aspx',
    ],
    [
      'https://www.24fa.com/c49.aspx',
      'https://www.268w.cc/c49.aspx',
      'https://www.116w.cc/c49.aspx',
    ],
    [
      'https://www.junmeitu.com/tags/',
      'https://www.junmeitu.com/xzjg/',
      'https://www.junmeitu.com/model/',
      'https://www.junmeitu.com/beauty/hot-1.html',
    ],
  ],
  supRaw_flat = supRaw.flat(Infinity),
  handle_limit = [
    [eveiraTags, check.all],
    [fa24Tags, check.all],
    [fa24c49, check.all],
    [junMeiTags, check.all],
  ]
const special_url = [
  [/^https?:\/\/everia.club\/?$/, 0],
  [/^https?:\/\/www\.junmeitu\.com\/beauty\/?$/, 3],
]

function filterTagsOnly(arr) {
  const arr1 = arr.filter(_ => special_url.some(r => r[0].test(_)))
  const arr2 = arr.filter(_ => supRaw_flat.some(s => _.startsWith(s)))
  return uniq(arr1.concat(arr2))
}

function getTaskIndexByUrl(url) {
  return getIndexByUrl(url, special_url, supRaw)
}

async function start() {
  // await admin_init()
  setInterval(run, check.period)
}

async function run() {
  const hall = await HGETALL(taskName)
  for (const url in hall) {
    const info = hall[url]
    if (info.nextTime < Date.now()) {
      const idx = getTaskIndexByUrl(url)
      const [handle, breakTime] = handle_limit[idx]
      if (!(handle && breakTime)) {
        throw new Error(`No support handle for this url: ${url}`)
      }
      await task(url, info, handle, breakTime)
    }
  }
}

async function task(url, info, handle, breakTime, start = format_date()) {
  const {title, imgs, cost} = await handle.getTagUrls(url),
    spent = time_human_readable(cost)
  if (imgs && imgs.length > 0) {
    let index = imgs.length
    if (info.latest.length === 0) {
      index = Math.min(index, taskLimit.firstMax)
    }
    info.latest.forEach(u => {
      index = Math.min(index, imgs.findIndex(_ => _.url === u))
    })
    const url_texts = imgs.slice(0, index)
    if (url_texts.length > 0) {
      info.latest = url_texts.map(_ => _.url).slice(0, taskLimit.latest)
      const urlTexts = log_url_texts(url_texts)
      // let text = `#${taskName} #${title}\n`
      let text = `#Subscribed\n#${title}\n`
      text += `Start: ${start}\n`
      text += `Spent: ${spent}\n`
      text += `${urlTexts}`
      for (const uid of info.uid) {
        await send_text(uid, text, undefined, true)
      }
    }
  }
  info.nextTime = get_random_next(breakTime)
  await HSET(url, info)
}

module.exports = {
  start,
  filterTagsOnly,
}
