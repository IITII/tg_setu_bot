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

/**
 * Calc how much time spent on run function.
 * @param func Run function
 * @param args function's args
 */
async function spendTime(func, ...args) {
  return await new Promise(async (resolve, reject) => {
    let start = new Date()
    try {
      await func.apply(this, args)
      return resolve(new Date() - start)
    } catch (e) {
      return reject(e)
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

async function downloadFile(url, filePath, logger) {
  return await new Promise((resolve, reject) => {
    if (fs.existsSync(filePath)) {
      logger.warn(`File ${filePath} already exists`)
      return resolve(filePath)
    }
    const writeStream = fs.createWriteStream(filePath)
    logger.debug(`Downloading ${url}...`)
    axios.get(url, {
      responseType: "stream",
    })
      .then(res => {
        writeStream.on('finish', resolve)
        writeStream.on('error', reject)
        res.data.pipe(writeStream)
      })
      .then(() => logger.debug(`Downloaded ${url} to ${filePath}`))
      .catch(e => {
        logger.error(`Download error: ${e.message}`)
        logger.error(e)
        return reject({
          url: url,
          filePath: filePath,
        })
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

function titleFormat(title, banWords = /[\[\]()+*.\\/]/g) {
  return title.replace(banWords, '')
}

async function extFormat(imgUrl, logger) {
  return await new Promise(async (resolve, reject) => {
    const suffix = path.extname(imgUrl)
    if (suffix) {
      logger.debug(`File suffix get from path.extname: ${suffix}`)
      return resolve(suffix)
    }
    await fileTypeFromUrlHead(imgUrl)
      .then(ex => resolve(`.${ex.ext}`))
      .catch(e => {
        if (e.message.includes(NO_CONTENT_TYPE_E_MSG)) {
          logger.debug(`File suffix get from fileTypeFromUrlHead failed: ${e.message}, try fileTypeFromUrl`)
          return fileTypeFromUrl(imgUrl)
        } else {
          return reject(e)
        }
      })
      .then(ex => resolve(`.${ex.ext}`))
      .catch(e => reject(e))
  })
}

function time_human_readable(mills, frac = 2) {
  const seconds = 1000,
    minutes = seconds * 60,
    hours = minutes * 60,
    days = hours * 24
  let res = ""
  let time = mills
  if (time >= days) {
    res += `${Math.floor(time / days)}d`
    time %= days
  }
  if (time >= hours) {
    res += `${Math.floor(time / hours)}h`
    time %= hours
  }
  if (time >= minutes) {
    res += `${Math.floor(time / minutes)}m`
    time %= minutes
  }
  if (time >= seconds) {
    res += `${(time / seconds).toFixed(frac)}s`
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
  extFormat,
  time_human_readable,
}