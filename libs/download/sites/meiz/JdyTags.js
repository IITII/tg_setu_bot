/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/03
 * @deprecated 网站响应太慢，放弃
 */
'use strict'

const {get_dom, getTagImgArr, urlTextsToAbs} = require('../../dl_utils')
const jdy = require('./Jdy')
const {titleFormat} = require('../../../utils')

module.exports = {
  getTagUrls,
  getImageArray,
}

async function getTagUrls(url) {
  return get_dom(url, handle_dom)
}

async function getImageArray(url) {
  return getTagImgArr(url, getTagUrls, jdy.getImageArray)
}

async function handle_dom($, original) {
  let title, posters, url_texts, urls, texts

  title = $('.collection-list-top h1').text() || $('.tax-title').text()
  urls = $('.post-list .mobile-hidden a').map((i, el) => el.attribs.href).get()
  url_texts = $('.post-list .mobile-hidden img').map((i, el) => {
    const url = urls[i]
    return {url, text: el.attribs.alt, poster: el.attribs['data-src']}
  }).get()
  // for tags
  if (!(urls && urls.length > 0)) {
    urls = $('.post_tag .post-module-thumb a').map((i, el) => el.attribs.href).get()
  }
  if (!(url_texts && url_texts.length > 0)) {
    url_texts = $('.post-list .post-module-thumb img').map((i, el) => {
      const url = urls[i]
      return {url, text: el.attribs.alt, poster: el.attribs['data-src']}
    }).get()
  }

  title = titleFormat(title)
  url_texts = urlTextsToAbs(url_texts, original, true)
  const res = {title, imgs: url_texts}
  return Promise.resolve(res)
}

