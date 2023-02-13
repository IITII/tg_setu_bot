/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2023/02/13
 */
'use strict'

const {getImgArr} = require('../dl_utils.js')
const {titleFormat} = require('../../utils.js')
const {urlTextsToAbs, arrToAbsUrl} = require('../dl_utils.js')
const {uniq} = require('lodash'),
  {load} = require('cheerio')
const {logger} = require("../../../middlewares/logger");

async function getImageArray(url) {
 return getImgArr(url, handle_dom, undefined, false)
}

async function handle_dom($, original) {
 let title, imgs, otherPages, related, tags, denyPages, urls, external, script, regex
 denyPages = '«,»'.split(',')

 title = $('.post-content .post-title').text()
 script =load($('#invisblecontent').html())
 imgs = script('#gallery img').map((i, el) => el.attribs['data-src'] || el.attribs['src']).get()
 tags = script('.infobox a').map((i, el) => {
    return {url: el.attribs.href, text: $(el).text()}
 }).get()
 external = script('#download a').map((i, el) => {
    return {url: el.attribs.href, text: $(el).text()}
  }).get()
 // imgs = $('#gallery img').map((i, el) => el.attribs['data-src'] || el.attribs['data-image']).get()
 // tags = $('.post-content .post-body .infobox a')
 // external = $('#download a').map((i, el) => {
 //  return {url: el.attribs.href, text: $(el).text()}
 // }).get()

 regex = /h\d+(-e\d+)?/
 imgs = imgs.map(i => {
  try {
   const targetPx = 'h4096'
   let arr = i.split('/'), res
   arr = arr[arr.length-2]
   if (regex.test(arr)) {
    res = i.replace(arr, targetPx)
    logger.debug(`replace ${arr} to ${targetPx}: ${i} -> ${res}`)
   } else {
    res = i
   }
   return res
  } catch (e) {
   logger.error(`parse error: ${i}`, e)
   return i
  }
 })

 title = titleFormat(title)
 imgs = uniq(imgs)
 imgs = arrToAbsUrl(imgs, original)
 tags = urlTextsToAbs(tags, original, true)
 external = urlTextsToAbs(external, original, true)

 const res = {title, imgs, tags, external}
 return Promise.resolve(res)
}

module.exports = {
 getImageArray,
}
