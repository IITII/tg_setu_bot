/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/28
 */
'use strict'

const { uniq, uniqBy, differenceBy } = require('lodash'),
  { check, taskName, taskLimit, clip } = require('../../config/config'),
  { format_date, spendTime } = require('../../libs/utils'),
  { getIndexByUrl } = require('../utils/support_urls_utils'),
  { getPhotoMsg, sendBatchMsg, getTextMsg } = require('../utils/msg_utils'),
  { get_random_next, HSET, HGETALL, get_sent_sub, set_sent_sub } = require('../tasks/redis_utils')
const EveiraTags = require('../../libs/download/sites/EveiraTags'),
  Fa24Tags = require('../../libs/download/sites/Fa24Tags'),
  fa24c49 = require('../../libs/download/sites/Fa24C49'),
  junMeiTags = require('../../libs/download/sites/JunMeiTags'),
  busTags = require('../../libs/download/sites/BusTags'),
  eveiraTags = new EveiraTags(),
  fa24Tags = new Fa24Tags()
const download = require('../../libs/download')
const { log_url_texts } = require('../utils/service_utils')

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
    'https://junmeitu.com/tags/',
    'https://junmeitu.com/xzjg/',
    'https://junmeitu.com/model/',
    'https://junmeitu.com/beauty/hot-1.html',
    'https://www.junmeitu.com/tags/',
    'https://www.junmeitu.com/xzjg/',
    'https://www.junmeitu.com/model/',
    'https://www.junmeitu.com/beauty/hot-1.html',
  ],
  [
    'https://www.javbus.com/star/',
    'https://www.javbus.com/uncensored/star/',
  ],
  [
    'https://dongtidemi.com/category/tu/xiezhen',
    'https://dongtidemi.com/category/tu/%e7%a6%8f%e5%88%a9%e5%a7%ac',
    'https://dongtidemi.com/category/tu/cos',
  ],
  [
    'https://dongtidemi.com/tag/',
    'https://dongtidemi.com/?s=',
    'https://dongtidemi.com/category/tu'
  ],
],
  supRaw_flat = supRaw.flat(Infinity),
  handle_limit = [
    [eveiraTags, check.all],
    [fa24Tags, check.all],
    [fa24c49, check.all],
    [junMeiTags, check.all],
    [busTags, check.all],
    [download.dongTiTagsTu, clip.dongTiTagLimit],
    [download.dongTiTags, clip.dongTiTagLimit],
  ]
const special_url = [
  [/^https?:\/\/everia.club\/?$/, 0],
  [/^https?:\/\/junmeitu\.com\/beauty\/?$/, 3],
  [/^https?:\/\/www\.junmeitu\.com\/beauty\/?$/, 3],
  [/^https?:\/\/www\.javbus\.com\/?$/, 3],
]

function filterTagsOnly(arr, formatHost = true) {
  const arr1 = arr.filter(_ => special_url.some(r => r[0].test(_)))
  const arr2 = arr.filter(_ => supRaw_flat.some(s => _.startsWith(s)))
  let res = uniq(arr1.concat(arr2))
  // TODO: URL rewrite
  if (formatHost) {

  }
  return res
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
  const { title, imgs } = await handle.getTagUrls(url)
  if (imgs && imgs.length > 0) {
    let index = imgs.length
    if (info.latest.length === 0) {
      index = Math.min(index, taskLimit.firstMax)
    }
    info.latest.forEach(u => {
      index = Math.min(index, imgs.findIndex(_ => _.url === u))
    })
    const url_texts = imgs.slice(0, index)

    // filter
    const filtered = await spendTime('filterNonSent', filterNonSent, url_texts)
    if (filtered.length > 0) {
      info.latest = filtered.map(_ => _.url).slice(0, taskLimit.latest)
    }
    // add filtered msg
    let addiMsg = ''
    const dup = differenceBy(url_texts, filtered, 'url')
    if (dup.length > 0) {
      addiMsg = `#Clean\n移除重复链接：${dup.length}条`
      addiMsg += `\n${log_url_texts(dup)}`
    }
    // add new sub msg
    let prefix = `#Subscribed\n#${title}\nStart: ${start}`
    await send_to_subscriber(prefix, info.uid, filtered, addiMsg)
    await set_sent_sub(url_texts.map(({ url, text }) => ({ url, text: format_sub_title(text) })))
  }
  info.nextTime = get_random_next(breakTime)
  await HSET(url, info)
}

async function filterNonSent(old) {
  let newToSend = old
  newToSend = uniqBy(newToSend, 'url')
  newToSend = uniqBy(newToSend, 'text')
  const sent_urls = await get_sent_sub(taskLimit.sub_prefix.url)
  const sent_texts = await get_sent_sub(taskLimit.sub_prefix.text)
  newToSend = newToSend.filter(_ => !sent_urls.includes(_.url))
  newToSend = newToSend.filter(_ => !sent_texts.includes(format_sub_title(_.text)))
  return newToSend
}

function format_sub_title(raw) {
  let res = raw
  res = res.replace(/[\[\]()+*.\\/\-—?${}@!&\n\r]/g, ' ')
  res = res.replace(/[~`|=+;:：'"<>。，《》【】「」、！￥—\-]/g, ' ')
  res = res.replace(/\d+月\d+日?会员(资源)?/g, ' ')
  res = res.replace(/福利(姬)?/g, ' ')
  res = res.replace(/COS(ER)?/ig, ' ')
  res = res.replace(/写真(集|套图)/g, ' ')
  res = res.replace(/(网红|套图)/g, ' ')
  res = res.replace(/\d+P/ig, ' ')
  res = res.replace(/\d+[MG]B/ig, ' ')
  res = res.replace(/\s+/g, '')
  return res
}

async function send_to_subscriber(prefix, uidArr, url_texts, addi = '') {
  // TODO: send to admin only
  const addiMsg = addi ? getTextMsg(uidArr[0], `${prefix}\n${addi}`, undefined, false) : []
  const msgArr = uidArr.map(u => {
    return url_texts.map(url_text => {
      const { url, text, poster } = url_text
      const m = `${prefix}\n[${text}](${url})`
      return poster ? getPhotoMsg(u, poster, m, true)
        // 虽然可能有吧，但是基本不可能
        : getTextMsg(u, m, undefined, true)
    })
  }).concat(addiMsg).flat(Infinity)
  return sendBatchMsg(msgArr)
}

module.exports = {
  start,
  filterTagsOnly,
}
