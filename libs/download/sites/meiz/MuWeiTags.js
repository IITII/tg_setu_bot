/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/03
 */
'use strict'

const {get_dom, getTagImgArr, urlTextsToAbs} = require('../../dl_utils')
const {titleFormat} = require('../../../utils')
const muWei = require('./MuWei')

module.exports = {
  getTagUrls,
  getImageArray,
}

async function getTagUrls(url) {
  return get_dom(url, handle_dom)
}

async function getImageArray(url) {
  return getTagImgArr(url, getTagUrls, muWei.getImageArray)
}

async function handle_dom($, original) {
  let title, posters, url_texts, urls, texts

  title = $('#content-container .feature-header h1').text()
  posters = $('#main-wrap .item-feature').map((i, el) => {
    let bg, key = 'background-image:'
    bg = el.attribs['style']
    bg = bg.split(/\s*;\s*/).filter(_ => _.includes(''))[0]
    bg = bg.replace(key, '').trim()
    if (bg.startsWith('url')) {
      bg = bg.replace(/(url|[\(\)"'])/g, '')
    }
    return bg
  }).get()
  url_texts = $('#main-wrap .item-title a').map((i, el) => {
    const e = posters[i]
    return {url: el?.attribs?.href, text: el?.attribs.title, poster: e}
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