/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/09/01
 */
'use strict'
const {get_dom, urlTextsToAbs, getTagImgArr} = require('../dl_utils')
const {titleFormat} = require('../../utils')
const asiaG = require('./AsiaG')

async function getTagUrls(url) {
 return get_dom(url, handle_dom)
}

async function getImageArray(url) {
 return getTagImgArr(url, getTagUrls, asiaG.getImageArray)
}

async function handle_dom($, original) {
 let title, posters, url_texts, urls, texts

 title = $('.page-title').text()
 urls = $('#grid-wrapper .post .post-thumbnail a').map((i, el) => el.attribs.href).get()
 url_texts = $('#grid-wrapper .post .post-thumbnail img').map((i, el) => {
  const url = urls[i]
  return {url, text: el.attribs.title, poster: el.attribs.src}
 }).get()

 title = titleFormat(title)
 url_texts = urlTextsToAbs(url_texts, original)
 const res = {title, imgs: url_texts}
 return Promise.resolve(res)
}

module.exports = {
 getTagUrls,
 getImageArray,
}