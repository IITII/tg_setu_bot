/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/25
 */
'use strict'
const AbsDownloader = require('./AbsDownloader')
const {toAbsUrl, zipUrlExt, getSaveDir, get_dom} = require('./dl_utils')
const {currMapLimit} = require('../utils')
const {uniq, uniqBy} = require('lodash')
const {clip} = require('../../config/config')
const dropText = '上一页,下一页'.split(',')
let self = null

module.exports = class Fa24 extends AbsDownloader {
  constructor() {
    super()
    self = this
  }

  async getImageArray(url) {
    const firstPage = await get_dom(url, this.handle_dom)
    let {title, imgs, otherPages, related} = firstPage
    const otherUrls = otherPages.map(p => p.url)
    const otherInfos = await currMapLimit(otherUrls, clip.pageLimit, this.handle_other_pages)
    imgs = uniq(imgs.concat(otherInfos.map(i => i.imgs)).flat(Infinity))
    imgs = await zipUrlExt(imgs, getSaveDir(title))
    related = related.concat(otherInfos.map(i => i.related)).flat(Infinity)
    related = uniqBy(related, 'url')
    const res = {title, imgs, related}
    return Promise.resolve(res)
  }

  async handle_other_pages(url) {
    return get_dom(url, self.handle_dom)
  }

  async handle_dom($, original) {
    const title = $('.newshow header h1').text()
    const rawUrls = $('.newshow article img').map((i, el) => el.attribs.src).get()
    const absImgs = toAbsUrl(rawUrls, original)
    // const imgs = await zipUrlExt(absImgs, getSaveDir(title))
    const otherPages = $('.newshow table a').map((i, el) => {
      return {url: el.attribs.href, text: $(el).text()}
    }).get()
    const dropped = otherPages.filter(p => dropText.some(d => p.text.includes(d)))
    const related = $('.box a').map((i, el) => {
      return {url: el.attribs.href, text: $(el).text()}
    }).get()
    const res = {title, imgs: absImgs, otherPages: dropped, related}
    return Promise.resolve(res)
  }
}