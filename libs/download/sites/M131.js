/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/26
 */
'use strict'

const {getImgArr, arrToAbsUrl, droppedPage, urlTextsToAbs} = require('../dl_utils')
const {titleFormat} = require('../../utils')
const {uniq} = require('lodash')

async function getImageArray(url) {
  return getImgArr(url, handle_dom)
}

async function handle_dom($, original) {
  let title, imgs, otherPages, related, tags, denyPages, urls, external
  denyPages = '«,»,上一页,下一页'.split(',')

  title = $('.content h5').text() || 'M131'
  title = title.replace(/\(\d+\)/, '')
  imgs = $('.content .content-pic img').map((i, el) => el.attribs['src']).get()

  otherPages = $('.content .content-page a').map((i, el) => {
    return {url: el.attribs.href, text: $(el).text()}
  }).get()

  title = titleFormat(title)
  imgs = uniq(imgs)
  imgs = arrToAbsUrl(imgs, original)
  otherPages = droppedPage(otherPages, denyPages)
  otherPages = urlTextsToAbs(otherPages, original, true)

  const res = {title, imgs, external, tags, otherPages}
  return Promise.resolve(res)
}

module.exports = {
  getImageArray,
}
