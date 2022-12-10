/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/03
 */
'use strict'

const {get_dom, getTagImgArr, urlTextsToAbs} = require('../dl_utils')
const {titleFormat} = require('../../utils')
const pic = require('./Jable.js')

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

  title = $('#page .content-wrapper h1').text()
  url_texts = $('#gridThumbs .grid-item img')
  if (url_texts.length === 0) {
    url_texts = $('#page .content-wrapper .gallery img')
    urls = $('#page .content-wrapper .gallery a')
  } else {
    urls = $('#gridThumbs .grid-item')
  }
  urls = urls.map((i, el) => el.attribs['href']).get()
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

// let url
// url = 'https://jablehk.com/snexxxxxxx-fantia-collection'
// url = 'https://jablehk.com/hongkonggirls7'
// url = 'https://jablehk.com/southeastasiangirls'
// url = 'https://jablehk.com'
// getTagUrls(url).then(console.log)
