/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const {titleFormat} = require('../../utils')
const {arrToAbsUrl, urlTextsToAbs} = require('../dl_utils')
const AbsDownloader = require('../AbsDownloader')
const {uniq} = require('lodash')

module.exports = class Eveira extends AbsDownloader {
  async handle_dom($, original) {
    const title = titleFormat($('.entry-header .title').text())
    const metaR = $('.entry-header ul a').map((i, el) => {
      return { url: el.attribs.href, text: $(el).text() }
    }).get(),
      meta = urlTextsToAbs(metaR, original)
    const tagsR = $('.nv-tags-list a').map((i, el) => {
      return { url: el.attribs.href, text: $(el).text() }
    }).get(),
      tags = urlTextsToAbs(tagsR, original)
    const rawImgs = $('.entry-content img').map((i, el) => el.attribs.src).get()
    const absImgs = arrToAbsUrl(rawImgs, original),
      imgs = uniq(absImgs)
    // const imgs = await zipUrlExt(absImgs, getSaveDir(title))
    const res = {title, meta, tags, imgs}
        return Promise.resolve(res)
    }
}