/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const fs = require('fs')
const {currMapLimit} = require('./utils')

function sendPhoto(source) {
  const res = {}
  // if (caption) {
  //   res['caption'] = {caption}
  // }
  switch (typeof source) {
    case 'string':
      let key
      if (source.startsWith('http')) {
        key = 'url'
      } else {
        key = 'source'
      }
      res[key] = source
      break
    case 'object':
      res['source'] = fs.createReadStream(source)
      break
    default:
      throw new Error(`Invalid source type: ${source}`)
  }
  return res
}

function singleMedia(source, caption = undefined) {
  let res = {media: source, caption, parse_mode: 'Markdown', type: 'photo'}
  switch (typeof source) {
    case 'string':
      if (!source.startsWith('http')) {
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
  return res
}

function getGroupMedia(sources, caption = 'caption') {
  let res
  const arr = sources.map(_ => singleMedia(_))
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