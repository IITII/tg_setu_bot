/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/03
 * @deprecated 网站响应太慢，放弃
 */
'use strict'

const {getImgArr, arrToAbsUrl, droppedPage, urlTextsToAbs} = require('../../dl_utils')
const {titleFormat} = require('../../../utils')

async function getImageArray(url) {
  return getImgArr(url, handle_dom)
}

async function handle_dom($, original) {
  let title, imgs, otherPages, related, tags, denyPages, urls
  denyPages = '«,»'.split(',')

  title = $('.entry-header h1').text()
  imgs = $('.entry-content img').map((i, el) => el.attribs.src).get()
  tags = $('.post-tags-meat a').map((i, el) => {
    return {url: el.attribs.href, text: $(el).text()}
  }).get()
  otherPages = $('.ajax-pager .ajax-pagenav a').map((i, el) => {
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
