/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/28
 */
'use strict'

const {uniq, uniqBy, differenceBy} = require('lodash'),
  {check, taskName, taskLimit} = require('../../config/config'),
  {format_date, spendTime, time_human_readable, format_sub_title} = require('../../libs/utils'),
  {supportUrlArr, getIndexByUrl} = require('../utils/support_urls_utils'),
  {getPhotoMsg, sendBatchMsg, getTextMsg} = require('../utils/msg_utils'),
  {get_random_next, HSET, HGETALL, get_sent_sub, set_sent_sub} = require('../utils/redis_utils')
const EveiraTags = require('../../libs/download/sites/EveiraTags'),
  Fa24Tags = require('../../libs/download/sites/Fa24Tags'),
  fa24c49 = require('../../libs/download/sites/Fa24C49'),
  junMeiTags = require('../../libs/download/sites/JunMeiTags'),
  busTags = require('../../libs/download/sites/BusTags'),
  eveiraTags = new EveiraTags(),
  fa24Tags = new Fa24Tags()
const download = require('../../libs/download')
const {log_url_texts} = require('../utils/service_utils')
const {logger} = require('../../middlewares/logger')

const supRaw = [
    [...supportUrlArr[1]],
    [...supportUrlArr[3]],
    [
      'https://www.24fa.com/c49.aspx',
      'https://www.268w.cc/c49.aspx',
      'https://www.116w.cc/c49.aspx',
    ],
    [...supportUrlArr[5]],
    [...supportUrlArr[7]],
    [...supportUrlArr[8]],
    [...supportUrlArr[9]],
    [...supportUrlArr[11]],
    [...supportUrlArr[13]],
    [...supportUrlArr[15]],
    [...supportUrlArr[17]],
    [...supportUrlArr[19]],
    [...supportUrlArr[21]],
    [...supportUrlArr[23]],
    [
      'https://jablehk.com/hongkonggirls',
      'https://jablehk.com/taiwangirls',
      'https://jablehk.com/koreanjapangirls',
      'https://jablehk.com/southeastasiangirls',
      'https://jablehk.com/adult',
    ],
    [...supportUrlArr[27]],
    [...supportUrlArr[29]],
    [...supportUrlArr[31]],
    [...supportUrlArr[33]],
  ],
  supRaw_flat = supRaw.flat(Infinity),
  handle_limit = [
    [eveiraTags, check.all],
    [fa24Tags, check.all],
    [fa24c49, check.all],
    [junMeiTags, check.all],
    [busTags, check.all],
    [download.dongTiTagsTu, check.all],
    [download.dongTiTags, check.all],
    [download.asiaGTags, check.all],
    [download.duaTags, check.all],
    [download.AcgBoxTags, check.all],
    [download.JdyTags, check.all],
    [download.MuWeiTags, check.all],
    [download.tmdPicTags, check.all],
    [download.knitTags, check.all],
    [download.jableTags, check.all],
    [download.asianTags, check.all],
    [download.m131Tags, check.all],
    [download.kupTags, check.all],
    [download.hentaiComicTags, check.all],
  ]
// const special_url_raw = [0,3,3,3,7,8,9,9,12,12,13,14,14,14,14,14,14,15,16,16,16]
const special_url = [
  [/^https?:\/\/everia.club\/?$/, 0],
  [/^https?:\/\/junmeitu\.com\/beauty\/?$/, 3],
  [/^https?:\/\/www\.junmeitu\.com\/beauty\/?$/, 3],
  [/^https?:\/\/www\.javbus\.com\/?$/, 3],
  [/^https?:\/\/theasiagirl\.com\/?$/, 7],
  [/^https?:\/\/buondua\.com\/hot\/?$/, 8],
  [/^https?:\/\/tu\.acgbox\.org\/index\.ph\/?p$/, 9],
  [/^https?:\/\/tu\.acgbox\.org\/?p$/, 9],
  [/^https?:\/\/tmdpic\.com\/index\.html\/?$/, 12],
  [/^https?:\/\/tmdpic\.com\/?$/, 12],
  [/^https?:\/\/xx\.knit\.bid\/?$/, 13],
  [/^https?:\/\/jablehk\.com\/?$/, 14],
  [/^https?:\/\/jablehk\.com\/hongkonggirls\d\/?$/, 14],
  [/^https?:\/\/jablehk\.com\/taiwangirls\d\/?$/, 14],
  [/^https?:\/\/jablehk\.com\/koreanjapangirls\d\/?$/, 14],
  [/^https?:\/\/jablehk\.com\/southeastasiangirls\d\/?$/, 14],
  [/^https?:\/\/jablehk\.com\/adult(-tw)?\/?$/, 14],
  [/^https?:\/\/asiantolick\.com\/?$/, 15],
  [/^https?:\/\/www\.mmm131\.com\/xinggan\/?$/, 16],
  [/^https?:\/\/www\.mmm131\.com\/qingchun\/?$/, 16],
  [/^https?:\/\/www\.mmm131\.com\/xiaohua\/?$/, 16],
  [/^https?:\/\/www\.mmm131\.com\/chemo\/?$/, 16],
  [/^https?:\/\/www\.mmm131\.com\/qipao\/?$/, 16],
  [/^https?:\/\/www\.mmm131\.com\/mingxing\/?$/, 16],
  [/^https?:\/\/www\.4kup\.net\/?$/, 17],
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

let busy = false
let currentTask = null
let busyTimer = null

async function run() {
  if (busy) {
    logger.warn('sub task busy, skip', currentTask)
    await send_to_subscriber(`#busy\n\nsub task busy, skip\n`, currentTask.info.uid, [], JSON.stringify(currentTask))
    return
  }
  try {
    busy = true
    const hall = await HGETALL(taskName)
    for (const url in hall) {
      const info = hall[url]
      if (info.nextTime < Date.now()) {
        const idx = getTaskIndexByUrl(url)
        const [handle, breakTime] = handle_limit[idx]
        if (!(handle && breakTime)) {
          throw new Error(`No support handle for this url: ${url}`)
        }
        logger.debug(`start task: ${url}, info:`, info)
        currentTask = {url, info}
        await task(url, info, handle, breakTime)
      }
    }
  } finally {
    // 0.5s 内重复触发，不再执行
    busyTimer = setTimeout(() => {
      busy = false
      currentTask = null
      busyTimer = null
    }, 500)
  }
}

async function task(url, info, handle, breakTime, start = format_date()) {
  const {title, imgs, cost} = await handle.getTagUrls(url)
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
    if (dup.length > 0 && taskLimit.message.sub_clean) {
      addiMsg = `#Clean\n移除重复链接：${dup.length}条`
      addiMsg += `\n${log_url_texts(dup)}`
    }
    // add new sub msg
    let prefix = `#Subscribed\n#${title}\nStart: ${start}`
    await send_to_subscriber(prefix, info.uid, filtered, addiMsg)
    await set_sent_sub(url_texts.map(({url, text}) => ({url, text: format_sub_title(text)})))
  } else if (imgs.length === 0 && info.latest.length > 0) {
    let prefix, msg
    prefix = `#订阅失效\n`
    msg = `以下订阅无法获取任何套图，疑似失效\n[${title}](${url})\n\n总耗时：${time_human_readable(cost || 0)}`
    await send_to_subscriber(prefix, info.uid, [], msg)
  }
  const nextTime = get_random_next(breakTime)
  info.nextTime = nextTime
  await HSET(url, info)
  logger.debug(`task: start: ${start}, next: ${format_date(nextTime)}, break: ${time_human_readable(breakTime)}, url: ${url}`)
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

async function send_to_subscriber(prefix, uidArr, url_texts, addi = '') {
  // TODO: send to admin only
  const addiMsg = addi ? getTextMsg(uidArr[0], `${prefix}\n${addi}`, undefined, false) : []
  const msgArr = url_texts.map(url_text => {
    return uidArr.map(u => {
      const {url, text, poster} = url_text
      const m = `${prefix}\n[${text}](${url})`
      return getPhotoMsg(u, poster, m, true)
    }).flat(Infinity)
  }).concat([addiMsg]).filter(_ => _.length > 0)
  return Promise.allSettled(msgArr.map(_ => sendBatchMsg(_)))
}

module.exports = {
  start,
  filterTagsOnly,
  run,
}
