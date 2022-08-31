/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/25
 */
'use strict'
const AbsDownloader = require('../AbsDownloader')
const {arrToAbsUrl, urlTextsToAbs, droppedPage, getImgArr} = require('../dl_utils')
const {titleFormat} = require('../../utils')
let self = null

module.exports = class Fa24 extends AbsDownloader {
  constructor() {
    super()
    self = this
  }

  async getImageArray(url) {
    return getImgArr(url, self.handle_dom)
  }

  async handle_dom($, original) {
    const isMobile = $('.pos').text().includes('首页 > ')
    if (isMobile) {
      return self.handle_mobile_dom($, original)
    } else {
      return self.handle_web_dom($, original)
    }
  }

  async handle_mobile_dom($, original) {
    const title = titleFormat($('.newshow header h1').text())
    const rawUrls = $('.newshow article img').map((i, el) => el.attribs.src).get()
    const absImgs = arrToAbsUrl(rawUrls, original)
    // const imgs = await zipUrlExt(absImgs, getSaveDir(title))
    // 其他页面的图片
    const otherPagesRaw = $('.newshow table a').map((i, el) => {
        return {url: el.attribs.href, text: $(el).text()}
      }).get(),
      dropped = droppedPage(otherPagesRaw),
      otherPages = urlTextsToAbs(dropped, original)
    // 相关文章
    const relatedRaw = $('.box a').map((i, el) => {
        return {url: el.attribs.href, text: $(el).text()}
      }).get(),
      related = urlTextsToAbs(relatedRaw, original)
    const res = {title, imgs: absImgs, otherPages, related}
    return Promise.resolve(res)
  }

  async handle_web_dom($, original) {
    const title = titleFormat($('#printBody h1').text())
    const rawUrls = $('#printBody #content img').map((i, el) => el.attribs.src).get()
    const absImgs = arrToAbsUrl(rawUrls, original)
    const otherPagesRaw = $('#printBody table a').map((i, el) => {
        return {url: el.attribs.href, text: $(el).text()}
      }).get(),
      dropped = droppedPage(otherPagesRaw),
      otherPages = urlTextsToAbs(dropped, original)
    const tagsR = $($('#middle .mframe .mframe .zh').get(0)).find('a').map((i, el) => {
        return {url: el.attribs.href, text: $(el).text()}
      }).get(),
      tags = urlTextsToAbs(tagsR, original)
    const relatedR = $($('#middle .mframe .mframe .wrapper').get(0)).find('a').map((i, el) => {
        return {url: el.attribs.href, text: $(el).text()}
      }).get(),
      related = urlTextsToAbs(relatedR, original)
    const res = {title, imgs: absImgs, otherPages, related, tags}
    return Promise.resolve(res)
  }
}