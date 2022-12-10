/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/26
 */
'use strict'

const path = require('path')
const {getImgArr, arrToAbsUrl, droppedPage, urlTextsToAbs} = require('../dl_utils')
const {titleFormat} = require('../../utils')
const {uniq} = require('lodash')

async function getImageArray(url) {
  return getImgArr(url, handle_dom)
}

async function handle_dom($, original) {
  let title, imgs, otherPages, related, tags, denyPages, urls, external
  denyPages = '«,»'.split(',')

  title = $('#wrap_post h1').text()
  imgs = $('#wrap_post img').map((i, el) => el.attribs['src']).get()
  external = $('#metadata_qrcode a').map((i, el) => {
    return {url: el.attribs.href, text: $(el).text()}
  }).get()
  tags = $('#categoria_tags_post a').map((i, el) => {
    return {url: el.attribs.href, text: $(el).text()}
  }).get()

  title = titleFormat(title)
  imgs = uniq(imgs)
  imgs = arrToAbsUrl(imgs, original)
  external = urlTextsToAbs(external, original, true)
  tags = urlTextsToAbs(tags, original, true)

  const res = {title, imgs, external, tags}
  return Promise.resolve(res)
}

module.exports = {
  getImageArray,
}
