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

  title = $('#wrap h1').text() || 'AsianToClick'
  url_texts = $('#container .background_miniatura img')
  urls = $('#container a').map((i, el) => el.attribs['href']).get()
  url_texts = url_texts.map((i, el) => {
    const poster = el.attribs['data-src'] || el.attribs['data-image'],
      text = el.attribs.alt,
      url = urls[i]
    return {url, text, poster}
  }).get()

  title = titleFormat(title)
  url_texts = urlTextsToAbs(url_texts, original, true)
  const res = {title, imgs: url_texts}
  return Promise.resolve(res)
}
