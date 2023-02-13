/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2023/02/13
 */
'use strict'

const {get_dom, getTagImgArr, urlTextsToAbs} = require('../dl_utils')
const {titleFormat} = require('../../utils')
const pic = require('./kup.js')

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

  title = $($('#breadcrumbs span').get(-1)).text()
  posters = $('#Blog1 .index-post-wrap .snippet-thumbnail img').map((i, el) => el.attribs['data-src'] || el.attribs['src']).get()
  url_texts = $('#Blog1 .index-post-wrap .snippet-thumbnail a').map((i, el) => {
    const poster = posters[i],
      text = el.attribs.title,
      url = el.attribs.href
    return {url, text, poster}
  }).get()

  title = title.replace('Search results for', '')
  title = titleFormat(title)
  url_texts = urlTextsToAbs(url_texts, original, true)
  const res = {title, imgs: url_texts}
  return Promise.resolve(res)
}
