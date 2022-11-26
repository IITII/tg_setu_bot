/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/26
 */
'use strict'

const {get_dom, getTagImgArr, urlTextsToAbs} = require('../dl_utils')
const {titleFormat} = require('../../utils')
const pic = require('./Knit')

module.exports = {
 getTagUrls,
 getImageArray,
}

async function getTagUrls(url) {
 return get_dom(url, handle_dom)
}

async function getImageArray(url) {
 return getTagImgArr(url, getTagUrls, pic.getImageArray)
}

async function handle_dom($, original) {
 let title, posters, url_texts, urls, texts

 title = '爱mz'
 posters = $('#main .thumbnail .imgbox div').map((i, el) => {
  let bg, key = 'background-image:'
  bg = el.attribs['style']
  bg = bg.split(/\s*;\s*/).filter(_ => _.includes(''))[0]
  bg = bg.replace(key, '').trim()
  if (bg.startsWith('url')) {
   bg = bg.replace(/(url|[\(\)"'])/g, '')
  }
  return bg
 }).get()

 url_texts = $('#main .thumbnail .imgbox').filter((i,el) => el.name === 'a').map((i, el) => {
  const poster = posters[i],
    text = el.attribs.title,
    url = el.attribs.href
  return {url, text, poster}
 }).get()

 title = titleFormat(title)
 url_texts = urlTextsToAbs(url_texts, original, true)
 const res = {title, imgs: url_texts}
 return Promise.resolve(res)
}
