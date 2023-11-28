/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/03
 */
'use strict'

const {get_dom, getTagImgArr, urlTextsToAbs} = require('../dl_utils')
const {titleFormat} = require('../../utils')
const pic = require('./HentaiComic.js')

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

  title = $('title').text()?.replace(/搜索[：:] ?/, '')
  title = title?.replace(/ ?- ?紳士漫畫-專註分享漢化本子\|邪惡漫畫/, '')
  // title = title.replace('')
  url_texts = $('.gallary_wrap .pic_box img')
  urls = $('.gallary_wrap .pic_box a').map((i, el) => el.attribs['href']).get()
  url_texts = url_texts.map((i, el) => {
    let poster = el.attribs['data-src'] || el.attribs['src'],
      text = el.attribs.alt,
      url = urls[i]
    text = text.replace(/<\/?em>/g, '')
    url = url.match(/photos-index-aid-(\d+).html/)
    url = url ? `https://www.hentaicomic.ru/photos-slide-aid-${url[1]}.html` : urls[i]
    return {url, text, poster}
  }).get()

  title = titleFormat(title)
  url_texts = urlTextsToAbs(url_texts, original, true)
  const res = {title, imgs: url_texts}
  return Promise.resolve(res)
}

let url = 'https://www.hentaicomic.ru/search/?q=Kitkatkitty&f=_all&s=create_time_DESC&syn=yes'
// url = 'https://www.hentaicomic.ru/albums-index-cate-3.html'
getTagUrls(url).then(console.log)
