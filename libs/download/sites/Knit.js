/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/26
 */
'use strict'

const {getImgArr, arrToAbsUrl, droppedPage, urlTextsToAbs} = require('../dl_utils')
const {titleFormat} = require('../../utils')

async function getImageArray(url) {
  return getImgArr(url, handle_dom)
}

async function handle_dom($, original) {
  let title, imgs, otherPages, related, tags, denyPages, urls
  denyPages = '«,»,‹‹ , ››,‹‹,››'.split(',')

  title = $('.focusbox-title').text()
  imgs = $('#img-box img').map((i, el) => el.attribs['data-src']).get()
  tags = $('.article-tags a').map((i, el) => {
    return {url: el.attribs.href, text: $(el).text()}
  }).get()
  otherPages = $('.pagination a').map((i, el) => {
    return {url: el.attribs.href, text: $(el).text()}
  }).get()

  title = titleFormat(title)
  imgs = arrToAbsUrl(imgs, original)
  tags = urlTextsToAbs(tags, original, true)
  otherPages = droppedPage(otherPages, denyPages)
  otherPages = urlTextsToAbs(otherPages, original, true)

  const res = {title, imgs, otherPages, related, tags}
  return Promise.resolve(res)
}

module.exports = {
  getImageArray,
}
