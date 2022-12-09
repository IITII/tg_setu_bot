/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const fs = require('fs')
const {currMapLimit, sleep} = require('./utils')
const axios = require('axios')
const {logger} = require('../middlewares/logger.js')

async function webpBuffer(url) {
  logger.info(`Get webp buffer from ${url}`)
  let res, sleepTime = 900
  res = await axios.get(url, {
    responseType: 'stream', headers: {
      ...axios.defaults.headers,
      'referer': url,
      Host: new URL(url).host,
      Connection: 'keep-alive',
    },
  }).then(_ => _.data)
  if (new URL(url).hostname.includes('wp.com')) {
    await sleep(sleepTime)
  }
  return res
}

async function sendPhoto(source) {
  const res = {}
  // if (caption) {
  //   res['caption'] = {caption}
  // }
  switch (typeof source) {
    case 'string':
      let key, value
      if (source.startsWith('http')) {
        if (source.endsWith('.webp')) {
          key = 'source'
          value = await webpBuffer(source)
        } else {
          key = 'url'
        }
      } else {
        key = 'source'
      }
      res[key] = value || source
      break
    case 'object':
      res['source'] = fs.createReadStream(source)
      break
    default:
      throw new Error(`Invalid source type: ${source}`)
  }
  return Promise.resolve(res)
}

async function getGroupMedia(sources, caption = 'caption', buffer = false) {
  async function singleMedia(source, caption = undefined) {
    try {
      let res, isHttp, isWebp
      res = {media: source, caption, parse_mode: 'Markdown', type: 'photo'}
      isHttp = source.startsWith('http')
      isWebp = isHttp && source.endsWith('.webp')

      if (isHttp) {
        if (isWebp || buffer) {
          let buf = await webpBuffer(source)
          res.media = {source: buf}
        }
      } else {
        res.media = {source}
      }

      return Promise.resolve(res)
    } catch (e) {
      logger.error(`Get single media failed, source: ${source}, e: ${e.message}`, e)
      return Promise.resolve(-1)
    }
  }

  let res, arr
  arr = await currMapLimit(sources, 1, singleMedia)
  arr = arr.filter(_ => _ !== -1)
  if (arr.length > 0) {
    arr[0].caption = caption
  }
  res = arr
  return res
}

module.exports = {
  getGroupMedia,
  sendPhoto,
}
