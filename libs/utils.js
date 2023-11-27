/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const fs = require('fs'),
  path = require('path'),
  {mapLimit} = require('async'),
  dayjs = require('dayjs')
const {axios} = require('./axios_client')
const {fileTypeFromUrlHead, fileTypeFromUrl, NO_CONTENT_TYPE_E_MSG} = require('./file_type')
const {logger} = require('../middlewares/logger')

/**
 * Calc how much time spent on run function.
 * @param prefix prefix
 * @param func Run function
 * @param args function's args
 */
async function spendTime(prefix, func, ...args) {
  return await new Promise(async (resolve, reject) => {
    let start = new Date()
    logger.info(`${prefix} start...`)
    try {
      const res = await func.apply(this, args)
      return resolve(res)
    } catch (e) {
      return reject(e)
    } finally {
      const spent = new Date() - start
      const cost = time_human_readable(spent)
      logger.info(`${prefix} end. Spent ${cost}`)
    }
  })
}

async function sleep(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms))
}

async function currMapLimit(array, limit = 10, func) {
  return mapLimit(array, limit, async (item, cb) => {
    return func(item).finally(cb)
  })
}

function mkdir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {recursive: true})
    console.log(`mkdir ${dir}`)
  }
}

async function downloadFile(url, filePath, referer = '') {
  return await new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      if (fs.statSync(filePath).size === 0) {
        logger.warn(`File ${filePath} exists but empty, removed.`)
        fs.unlinkSync(filePath)
      } else {
        logger.warn(`File ${filePath} already exists`)
        return resolve(filePath)
      }
    }
    const writeStream = fs.createWriteStream(filePath)
    logger.debug(`Downloading ${url}...`)
    const opts = {
      responseType: 'stream',
      headers: axios.defaults.headers,
    }
    if (referer) {
      opts.headers['referer'] = referer
    }
    axios.get(url, opts)
      .then(res => {
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
        res.data.pipe(writeStream)
      })
      .then(() => logger.debug(`Downloaded ${url} to ${filePath}`))
      .catch(e => {
        logger.error(`Download error ${e.status}: ${e.message}`, e)
        return reject(e)
      })
  })
}

/**
 * 爬虫速率限制
 * @param func 消费数组内每个对象的函数
 * @param array 数据数组
 * @param duration 每次执行的时间间隔
 * @param forceWait
 * @param limit 并发上限
 * @param random 是否添加随机延迟 默认：0-100 ms
 */
async function reqRateLimit(func, array, duration = 1000,
                            forceWait = false,
                            limit = 1, random = true) {
  return mapLimit(array, limit, async (item, cb) => {
    const start = new Date()
    return await Promise.resolve()
      .then(async () => await func(item))
      // return await func(item)
      .then(async _ => {
        const spent = new Date() - start
        if (spent < duration) {
          let sleepTime = duration
          if (!forceWait) {
            sleepTime -= spent
          }
          if (random) {
            sleepTime += Math.random() * 100
          }
          await sleep(sleepTime)
        }
        return _
      })
      .finally(cb)
  })
}

function titleFormat(title) {
  let res = format_sub_title(title, ' ').trim()
  return res ? res : title
}

function format_sub_title(raw, multiSpace = '') {
  let res = raw
  res = res.replace(/[\[\]()+*.\\/\-—–?${}@!&\n\r~`|=#…%;；:：'"<>。，,《》【】「」、！￥（）～]/g, ' ')
  // res = res.replace(/\d+月\d+日?会员(资源)?/g, ' ')
  res = res.replace(/福利(姬)?/g, ' ')
  // res = res.replace(/COS(ER)?/ig, ' ')
  res = res.replace(/写真(集|套图)/g, ' ')
  res = res.replace(/标题：?/g, ' ')
  res = res.replace(/(网红|套图)/g, ' ')
  res = res.replace(/email\s?protected/g, ' ')
  // res = res.replace(/\d+\s?photos/g, ' ')
  res = res.replace(/photos/g, ' ')
  res = res.replace(/Page\s\d+/g, ' ')
  // res = res.replace(/\s\d+P(\d+[MG]B)?(\d+V)?/ig, ' ')
  res = res.replace(/P(\d+[MG]B)?(\d+V)?/ig, 'P')
  res = allowChars(res)
  res = res.replace(/\s+/g, multiSpace)
  return res.trim()
}

async function extFormat(imgUrl, allowTypes = /\.(jpe?g|png|webp|jiff)/) {
  return await new Promise(async (resolve, reject) => {
    let suffix = path.extname(imgUrl)
    if (suffix && suffix.match(allowTypes)) {
      let idx = suffix.indexOf('?')
      suffix = idx > -1 ? suffix.substring(0, idx) : suffix
      logger.debug(`File suffix get from path.extname: ${suffix}`)
      return resolve(suffix)
    }
    const prefix = `fileTypeFromUrlHead from ${imgUrl}`
    await spendTime(prefix, fileTypeFromUrlHead, imgUrl)
      .then(ex => resolve(`.${ex.ext}`))
      .catch(e => {
        if (e.message.includes(NO_CONTENT_TYPE_E_MSG)) {
          logger.debug(`Get from fileTypeFromUrlHead failed: ${e.message}, try fileTypeFromUrl`)
          const prefix = `fileTypeFromUrl from ${imgUrl}`
          return spendTime(prefix, fileTypeFromUrl, imgUrl)
        } else {
          return reject(e)
        }
      })
      .then(ex => resolve(`.${ex.ext}`))
      .catch(e => reject(e))
  })
}

function time_human_readable(mills, frac = 2) {
  const seconds = 1000
  const units = [
    {unit: 'd', value: 24 * 60 * 60 * seconds},
    {unit: 'h', value: 60 * 60 * seconds},
    {unit: 'm', value: 60 * seconds},
  ]
  let res = ''
  let time = mills
  units.forEach(u => {
    if (time >= u.value) {
      res += `${Math.floor(time / u.value)}${u.unit}`
      time %= u.value
    }
  })
  res += `${(time / seconds).toFixed(frac)}s`
  return res
}

function zipWithIndex(arr) {
  let i = 0
  return arr.map(item => [item, i++])
}

function url_resolve(from, to) {
  const resolvedUrl = new URL(to, new URL(from, 'resolve://'))
  if (resolvedUrl.protocol === 'resolve:') {
    // `from` is a relative URL.
    const {pathname, search, hash} = resolvedUrl
    return pathname + search + hash
  }
  return resolvedUrl.toString()
}

function format_date(curr = Date.now()) {
  const format = 'YYYY/MM/DD HH:mm'
  return dayjs(curr).format(format)
}

function base64_encode(str, magic = 'base64_') {
  return magic + Buffer.from(str).toString('base64')
}

function base64_decode(str, magic = 'base64_') {
  return Buffer.from(str.replace(magic, ''), 'base64').toString()
}

/**
 * 筛选特殊字符
 * @example escape('1aA-_@中é') => 1aA-_@%u4E2D%E9
 */
function allowChars(str, log = logger) {
  let res = ''
  for (const c of str) {
    let uni = escape(c), c16, url_max = 0x7e, rep = false
    switch (uni.length) {
      case 1:
        // ascii chars
        break
      case 3:
        // URL encode
        // https://blog.csdn.net/guoquanyou/article/details/3268939
        c16 = uni.slice(1)
        c16 = parseInt(c16, 16)
        if (c16 > url_max) {
          rep = true
          log.warn(`URL encode char '${c}' => ${uni} is not allowed`, str)
        }
        break
      case 6:
        // unicode
        // allow 中文 & ascii: /(\w|[\u4E00-\u9FA5])*/
        const notAll = ['%u0301']
        if (notAll.indexOf(uni) >= 0) {
          rep = true
          log.warn(`URL encode char '${c}' => ${uni} is not allowed`, str)
        } else {
          //
        }
        break
      case 12:
        // unicode emoji
        rep = true
        log.warn(`emoji '${c}' => ${uni} is not allowed`, str)
        break
      default:
        rep = true
        log.warn(`char '${c}' => ${uni} too long: ${uni.length}`, str)
        break
    }
    if (!rep) {
      res += c
    }
  }
  return res
}

module.exports = {
  mkdir,
  downloadFile,
  spendTime,
  sleep,
  currMapLimit,
  reqRateLimit,
  titleFormat,
  format_sub_title,
  extFormat,
  time_human_readable,
  zipWithIndex,
  url_resolve,
  format_date,
  base64_encode,
  base64_decode,
  allowChars,
}
