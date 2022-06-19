/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const fs = require('fs'),
  path = require('path'),
  {chunk} = require('lodash'),
  {maxMediaGroupLength, maxMessageRate} = require('../config/config').telegram
const {reqRateLimit} = require('./utils')
const {send_photo, send_media} = require('../services/telegram_msg_sender')

function sendPhoto(source, caption = undefined) {
  switch (typeof source) {
    case 'string':
      if (source.startsWith('http')) {
        return {url: source}
      } else {
        return {source: source}
      }
    case 'object':
      return {source: fs.createReadStream(source)}
    default:
      throw new Error('Invalid source type')
  }
}

function singleMedia(source, caption = undefined) {
  switch (typeof source) {
    case 'string':
      if (source.startsWith('http')) {
        return {media: source, caption, type: 'photo'}
      } else {
        return {media: {source}, caption, type: 'photo'}
      }
    case 'object':
      return {media: {source: fs.createReadStream(source)}, caption, type: 'photo'}
    default:
      throw new Error('Invalid source type')
  }
}

function getGroupMedia(sources, captionType = 'filename') {
  let res
  if (captionType === 'filename') {
    res = sources.map(_ => singleMedia(_, path.basename(_)))
  } else {
    const arr = sources.map(_ => singleMedia(_))
    if (arr.length > 0) {
      arr[0].caption = captionType
    }
    res = arr
  }
  return res
  // return chunk(res, maxMediaGroupLength)
}

async function sendMediaGroup(bot, chat_id, urls, captionType = 'filename', showProgress = true) {
  if (!Array.isArray(urls)) {
    urls = [].concat(urls)
  }
  let {cur, total} = {cur: 0, total: urls.length}
  async function func(sub) {
    let res
    cur += sub.length
    let cap = captionType
    if (showProgress) {
      cap = `${captionType} ${cur}/${total}`
    }
    if (sub.length > 1) {
      res = send_media(chat_id, sub, cap)
    } else {
      res = send_photo(chat_id, sub, cap)
    }
    return res
  }
  const grouped = chunk(urls, maxMediaGroupLength)
  // 线性处理
  return reqRateLimit(func, grouped, 1, false)
}

module.exports = {
  getGroupMedia,
  sendPhoto,
  sendMediaGroup,
}