/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/09/02
 */
'use strict'
const {getImgArr, arrToAbsUrl, droppedPage, urlTextsToAbs} = require('../dl_utils')
const {titleFormat} = require('../../utils')

async function getImageArray(url) {
  return getImgArr(url, handle_dom)
}

async function handle_dom($, original) {
  let title, imgs, otherPages, related, tags, denyPages, urls
  denyPages = '«,»'.split(',')

  title = $('.article .article-header').text()
  imgs = $('.article .article-fulltext img').map((i, el) => el.attribs.src).get()
  otherPages = $('.article .pagination a').map((i, el) => {
    return {url: el.attribs.href, text: $(el).text()}
  }).get()
  tags = $('.bottom-articles .article-tags a').map((i, el) => {
    return {url: el.attribs.href, text: $(el).text()}
  }).get()
  urls = $('.bottom-articles .item-thumb a').map((i, el) => el.attribs.href).get()
  related = $('.bottom-articles .item-thumb img').map((i, el) => {
    const url = urls[i]
    return {url, text: el.attribs.alt, poster: el.attribs.src}
  }).get()


  title = titleFormat(title)
  imgs = arrToAbsUrl(imgs, original)
  otherPages = droppedPage(otherPages, denyPages)
  otherPages = urlTextsToAbs(otherPages, original, true)
  tags = urlTextsToAbs(tags, original, true)
  related = urlTextsToAbs(related, original, true)
  const res = {title, imgs, otherPages, related, tags}
  return Promise.resolve(res)
}

module.exports = {
  getImageArray,
}