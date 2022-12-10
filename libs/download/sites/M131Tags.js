/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/03
 */
'use strict'

const {get_dom, getTagImgArr, urlTextsToAbs} = require('../dl_utils')
const {titleFormat} = require('../../utils')
const pic = require('./Asian.js')

module.exports = {
  getTagUrls,
  getImageArray,
}

async function getTagUrls(url) {
  return get_dom(url, handle_dom)
}

async function getImageArray(url) {
  return getTagImgArr(url, getTagUrls, pic.getImageArray)
}

async function handle_dom($, original) {
  let title, posters, url_texts, urls, texts

  title = $('.main .public-title a')
  title = $(title.get(title.length - 1)).text() || 'M131'
  url_texts = $('.main dd img')
  urls = $('.main dd a').map((i, el) => el.attribs['href']).get()
  // posters = $('.main dd img').map((i, el) => el.attribs['src']).get()
  url_texts = url_texts.map((i, el) => {
    const poster = el.attribs['src'],
      text = el.attribs.alt,
      url = urls[i]
    return {url, text, poster}
  }).get()

  title = titleFormat(title)
  url_texts = urlTextsToAbs(url_texts, original, true)
  const res = {title, imgs: url_texts}
  return Promise.resolve(res)
}

