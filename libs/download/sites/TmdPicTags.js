/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/03
 */
'use strict'

const {get_dom, getTagImgArr, urlTextsToAbs} = require('../dl_utils')
const {titleFormat} = require('../../utils')
const pic = require('./TmdPic')

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

  title = new URL(original).pathname.replace(/(category|tags|index.html|\/)/g, '')
  title = decodeURI(title)
  posters = $('#main .panel-body .thumbnail img').map((i, el) => el.attribs.src).get()
  url_texts = $('#main .panel-body .bottombar a').map((i, el) => {
    const poster = posters[i],
      text = $(el).text(),
      url = el.attribs.href
    return {url, text, poster}
  }).get()

  title = titleFormat(title)
  url_texts = urlTextsToAbs(url_texts, original, true)
  const res = {title, imgs: url_texts}
  return Promise.resolve(res)
}

