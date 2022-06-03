/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const {mapLimit} = require('async')
const fs = require('fs')
const axios = require('./axios_client')

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

// TODO: rateLimit
async function rateLimit(maxRequest, duration, func, ...args) {
  const reqQueue = []

  let start = new Date()
  let count = 0
  while (true) {
    try {
      await func.apply(this, args)
      count++
      if (count >= maxRequest) {
        return
      }
    } catch (e) {
      console.error(e)
    }
    if (new Date() - start > duration) {
      return
    }
    await sleep(1000)
  }
}

module.exports = {
  mkdir,
  downloadFile,
  spendTime,
  sleep,
  currMapLimit,
}