/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/09/01
 */
'use strict'

const {droppedPage, arrToAbsUrl, urlTextsToAbs, getImgArr} = require('../dl_utils')
const {titleFormat} = require('../../utils')

async function getImageArray(url) {
  return getImgArr(url, handle_dom)
}

async function handle_dom($, original) {
  let title = $('.post-inner .post-title').text()
  let imgs = $('.entry-inner img').map((i, el) => el.attribs.src).get()
  let otherPages = $('.entry-inner .pagination a').map((i, el) => {
    return {url: el.attribs.href, text: $(el).text()}
  }).get()
  let tags = $('.post-tags a').map((i, el) => {
    return {url: el.attribs.href, text: $(el).text()}
  }).get()
  let posters = $('.related .post-thumbnail img').map((i, el) => el.attribs.src).get()
  // let related = $('.related-posts .related .related-inner a').map((i, el) => {
  let related = $('.related .related-inner a').map((i, el) => {
    const poster = posters[i]
    return {url: el.attribs.href, text: $(el).text(), poster}
  }).get()
  title = titleFormat(title)
  imgs = arrToAbsUrl(imgs, original)
  otherPages = droppedPage(otherPages, '«,»'.split(','))
  otherPages = urlTextsToAbs(otherPages, original)
  tags = urlTextsToAbs(tags, original)
  related = urlTextsToAbs(related, original)
  const res = {title, imgs, otherPages, related, tags}
  return Promise.resolve(res)
}

module.exports = {
  getImageArray,
}