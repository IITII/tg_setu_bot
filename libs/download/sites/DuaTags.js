/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/09/03
 */
'use strict'

const {get_dom, getTagImgArr, urlTextsToAbs} = require('../dl_utils')
const dua = require('./Dua')
const {titleFormat} = require('../../utils')

module.exports = {
  getTagUrls,
  getImageArray,
}

async function getTagUrls(url) {
  return get_dom(url, handle_dom)
}

async function getImageArray(url) {
  return getTagImgArr(url, getTagUrls, dua.getImageArray)
}

async function handle_dom($, original) {
  let title, posters, url_texts, urls, texts

  title = $('.main-body .content').text()
  urls = $('.main-body .item-thumb a').map((i, el) => el.attribs.href).get()
  url_texts = $('.main-body .item-thumb img').map((i, el) => {
    const url = urls[i]
    return {url, text: el.attribs.alt, poster: el.attribs.src}
  }).get()

  title = titleFormat(title)
  url_texts = urlTextsToAbs(url_texts, original, true)
  const res = {title, imgs: url_texts}
  return Promise.resolve(res)
}