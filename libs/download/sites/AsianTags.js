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


let url
// url = 'https://asiantolick.com/post-2161/%E7%99%BD%E8%A5%AA%E8%A5%AA%E6%A0%BC%E7%BE%85%E4%B8%AB-big-boobs-sister-42p'
url = 'https://asiantolick.com/category-93/%E6%80%A7%E6%84%9F%E7%9A%84'
url = 'https://asiantolick.com/tag-1106/big-boobs'
url = 'https://asiantolick.com/'
// getImageArray(url).then(console.log)
getTagUrls(url).then(console.log)
