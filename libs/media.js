/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const fs = require('fs')
const {currMapLimit, sleep} = require('./utils')
const axios = require('axios')

async function webpBuffer(url) {
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

async function singleMedia(source, caption = undefined) {
  let res = {media: source, caption, parse_mode: 'Markdown', type: 'photo'}
  switch (typeof source) {
    case 'string':
      if (source.startsWith('http')) {
        if (source.endsWith('.webp')) {
          let res = await webpBuffer(source)
          res.media = {source: res}
        }
      } else {
        res.media = {source}
      }
      break
    // 不存在 case
    // case 'object':
    //   res.media = {source: fs.createReadStream(source)}
    //   break
    default:
      throw new Error('Invalid source type')
  }
  return Promise.resolve(res)
}

async function getGroupMedia(sources, caption = 'caption') {
  let res
  const arr = await currMapLimit(sources, 1, singleMedia)
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