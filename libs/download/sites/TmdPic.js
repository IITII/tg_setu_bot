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
 denyPages = '«,»'.split(',')

 title = $('#main .media-heading').text()
 imgs = $('#main .panel-body img').map((i, el) => el.attribs.src).get()
 tags = $('#main .panel-footer .opts a').map((i, el) => {
  return {url: el.attribs.href, text: $(el).text()}
 }).get()

 title = titleFormat(title)
 imgs = arrToAbsUrl(imgs, original)
 tags = urlTextsToAbs(tags, original, true)

 const res = {title, imgs, tags}
 return Promise.resolve(res)
}

module.exports = {
 getImageArray,
}
