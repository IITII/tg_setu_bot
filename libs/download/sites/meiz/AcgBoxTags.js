/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/03
 */
'use strict'

const {get_dom, getTagImgArr, urlTextsToAbs} = require('../../dl_utils')
const {titleFormat} = require('../../../utils')
const acgBox = require('./AcgBox')

module.exports = {
  getTagUrls,
  getImageArray,
}

async function getTagUrls(url) {
  return get_dom(url, handle_dom)
}

async function getImageArray(url) {
  return getTagImgArr(url, getTagUrls, acgBox.getImageArray)
}

async function handle_dom($, original) {
  let title, posters, url_texts, urls, texts

  title = $('.archive-title h3').text().replace(/(^分类|下的文章$)/g, '')
  urls = $('#masonry a').map((i, el) => el.attribs['href']).get()
  url_texts = $('#masonry img').map((i, el) => {
    const url = urls[i]
    return {url, text: el.attribs.alt, poster: el.attribs['data-original']}
  }).get()

  title = titleFormat(title)
  url_texts = urlTextsToAbs(url_texts, original, true)
  const res = {title, imgs: url_texts}
  return Promise.resolve(res)
}
