/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/03
 */
'use strict'

const {arrToAbsUrl, post_dom, format_origin} = require('../../dl_utils')
const {titleFormat} = require('../../../utils')
const {logger} = require('../../../../middlewares/logger')
const {cookies} = require('../../../../config/config')
let cookie, postBody
cookie = cookies.acgBox.cookie
postBody = cookies.acgBox.postBody

async function getImageArray(url, retry = 0) {
  return post_dom(url, postBody, handle_dom, handle_protected, true, retry, format_origin(url), cookie)
}

async function handle_protected($, original, error, retryCnt = 0) {
  let el, action, res
  el = $(".protected")
  if (el.length > 0) {
    el = el.get(0)
    action = el.attribs?.action
    if (action) {
      res = await getImageArray(action, retryCnt + 1)
    } else {
      logger.error(`[AcgBox] handle_protected: action is empty, url: ${original}`, error)
    }
  } else {
    logger.error(`[AcgBox] handle_protected: form not found, url: ${original}`, error)
  }
  // res.original = original
  return Promise.resolve(res)
}

async function handle_dom($, original) {
  let title, imgs, otherPages, related, tags, denyPages, urls
  denyPages = '«,»'.split(',')

  title = $($('.post-info .post-info-box').get(0)).text()
  imgs = $('#masonry img').map((i, el) => el.attribs['data-original']).get()

  title = titleFormat(title)
  imgs = arrToAbsUrl(imgs, original)

  const res = {title, imgs, otherPages, related, tags}
  return Promise.resolve(res)
}

module.exports = {
  getImageArray,
}
