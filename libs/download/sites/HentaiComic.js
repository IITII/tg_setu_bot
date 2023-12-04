/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2023/11/28
 */
'use strict'

const path = require('path')
const {getImgArr, arrToAbsUrl, droppedPage, urlTextsToAbs} = require('../dl_utils')
const {titleFormat} = require('../../utils')
const {uniq} = require('lodash')

async function getImageArray(url) {
  let res = await getImgArr(url, handle_dom)
  let m = url.match(/photos-index-aid-(\d+).html/)
  if (!m) {
    m = url.match(/photos-slide-aid-(\d+).html/)
  }
  if (m) {
    let url1 = `https://www.hentaicomic.ru/photos-gallery-aid-${m[1]}.html`
    let res1 = await getImgArr(url1, handle_dom)
    res.imgs = res.imgs.concat(res1.imgs)
    res.cost += res1.cost
  }
  return res
}

async function handle_dom($, original) {
  let title, imgs, otherPages, related, tags, denyPages, urls, external
  denyPages = '«,»'.split(',')

  title = $('title').text()?.replace(/ ?- ?列表 ?- ?紳士漫畫-專註分享漢化本子\|邪惡漫畫/, '')
  imgs = $.text()?.split('\n').filter(_ => _.includes('imglist')).filter(_ => _.includes('fast_img_host'))[0]
  // imgs = imgs.replace(/^document.writeln\("(\s+)?/, '').replace(/;?"\);/, '')
  imgs = imgs?.split('},').map(_ => {
    let m = _.match(/"\/\/([\s\S]+)\\",/)
    return m ? m[1] : ''
  }).filter(_ => !!_).map(_ => `http://${_}`)

  title = titleFormat(title)
  imgs = uniq(imgs)
  imgs = arrToAbsUrl(imgs, original)

  const res = {title, imgs,}
  return Promise.resolve(res)
}

module.exports = {
  getImageArray,
}
