/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/07/05
 */
'use strict'
const {get_dom, arrToAbsUrl, urlTextsToAbs} = require('../dl_utils')
const {titleFormat} = require('../../utils')

async function getImageArray(url) {
  return get_dom(url, handle_dom)
}

async function handle_dom($, original) {
  const title = titleFormat($('.entry-head h1').text())
  const imgsR = $('.entry-content img').map((i, el) => el.attribs['data-original']).get(),
    imgs = arrToAbsUrl(imgsR, original)
  const tagsR = $('.entry-tag a').map((i, el) => {
      const url = el.attribs.href
      const text = $(el).text()
      return {url, text}
    }).get(),
    tags = urlTextsToAbs(tagsR, original)
  const relatedR = $('.entry-related-posts .entry-related .item-wrap').map((i, el) => {
      const url = el.attribs.href
      const text = el.attribs.title
      return {url, text}
    }).get(),
    related = urlTextsToAbs(relatedR, original)
  const res = {title, imgs, tags, related}
  return Promise.resolve(res)
}

module.exports = {
  getImageArray,
}