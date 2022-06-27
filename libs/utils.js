/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const {mapLimit} = require('async')
const fs = require('fs'),
  path = require('path')
const axios = require('./axios_client')
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
      logger.warn(`File ${filePath} already exists`)
      return resolve(filePath)
    }
    const writeStream = fs.createWriteStream(filePath)
    logger.debug(`Downloading ${url}...`)
    const opts = {
      responseType: 'stream',
      headers: axios.defaults.headers
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
        logger.error(`Download error: ${e.message}`)
        logger.error(e)
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

function titleFormat(title,
                     banWords = /[\[\]()+*.\\/\-—?${}@!&\n\r]/g,
                     cleanMtiSpace = /\s+/g) {
  return title
    .replace(banWords, '')
    .replace(cleanMtiSpace, ' ')
}

async function extFormat(imgUrl, allowTypes = /\.(jpe?g|png|webp)/) {
  return await new Promise(async (resolve, reject) => {
    const suffix = path.extname(imgUrl)
    if (suffix && suffix.match(allowTypes)) {
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

module.exports = {
  mkdir,
  downloadFile,
  spendTime,
  sleep,
  currMapLimit,
  reqRateLimit,
  titleFormat,
  extFormat,
  time_human_readable,
  zipWithIndex,
  url_resolve,
}