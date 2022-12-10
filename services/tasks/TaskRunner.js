/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/28
 */
'use strict'

const {uniq, uniqBy, differenceBy} = require('lodash'),
  {check, taskName, taskLimit} = require('../../config/config'),
  {format_date, spendTime, time_human_readable, format_sub_title} = require('../../libs/utils'),
  {getIndexByUrl} = require('../utils/support_urls_utils'),
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
      'https://dongtidemimi.org/category/tu/xiezhen',
      'https://dongtidemimi.org/category/tu/%e7%a6%8f%e5%88%a9%e5%a7%ac',
      'https://dongtidemimi.org/category/tu/cos',
      'https://dongtidemimi.org/category/tu/tu2',
      'https://dongti2022.com/category/tu/xiezhen',
      'https://dongti2022.com/category/tu/%e7%a6%8f%e5%88%a9%e5%a7%ac',
      'https://dongti2022.com/category/tu/cos',
      'https://dongti2022.com/category/tu/tu2',
      'https://dongtidemi.com/category/tu',
      'https://dongtidemimi.org/category/tu',
      'https://dongti2022.com/category/tu',
    ],
    [
      'https://dongtidemi.com/tag/',
      'https://dongtidemi.com/?s=',
      'https://dongtidemimi.org/tag/',
      'https://dongtidemimi.org/?s=',
      'https://dongti2022.com/tag/',
      'https://dongti2022.com/?s=',
    ],
    [
      'https://theasiagirl.com/tag/',
      'https://theasiagirl.com/?s=',
    ],
    [
      'https://buondua.com/?search=',
      'https://buondua.com/tag/',
      'https://buondua.com/hot',
    ],
    [
      'https://tu.acgbox.org/index.php/category/',
      'https://tu.acgbox.org/index.php/search/',
    ],
    [
      'https://www.jdlingyu.com/collection/',
      'https://www.jdlingyu.com/tag/',
    ],
    [
      'https://www.muweishe.com/meizitu/',
      'https://www.muweishe.com/tag/',
    ],
    [
      'https://tmdpic.com/category/',
      'https://tmdpic.com/tags/',
    ],
    [
      'https://xx.knit.bid/sort',
      'https://xx.knit.bid/tag/',
      'https://xx.knit.bid/type/',
      'https://xx.knit.bid/search/',
    ],
    [
      'https://jablehk.com/hongkonggirls',
      'https://jablehk.com/taiwangirls',
      'https://jablehk.com/koreanjapangirls',
      'https://jablehk.com/southeastasiangirls',
      'https://jablehk.com/adult',
    ],
    [
      'https://asiantolick.com/category',
      'https://asiantolick.com/tag',
      'https://asiantolick.com/search/',
      'https://asiantolick.com/page/',
    ],
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
  ]
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
let busyTimer = null

async function run() {
  if (busy) {
    logger.warn('sub task busy, skip')
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
        await task(url, info, handle, breakTime)
      }
    }
  } finally {
    // 0.5s 内重复触发，不再执行
    busyTimer = setTimeout(() => {
      busy = false
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
}
