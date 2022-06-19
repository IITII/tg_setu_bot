/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const fs = require('fs'),
  path = require('path')

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

module.exports = {
  getGroupMedia,
  sendPhoto,
}