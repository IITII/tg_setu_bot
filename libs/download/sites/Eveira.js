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
    const title = titleFormat($('.entry-header h1').text())
    const tagsR = $('#content .post-tags a').map((i, el) => {
        return {url: el.attribs.href, text: $(el).text()}
      }).get(),
      tags = urlTextsToAbs(tagsR, original)
    const rawImgs = $("#content figure img").map((i, el) => el.attribs['data-src'] || el.attribs['src']).get()
    const absImgs = arrToAbsUrl(rawImgs, original),
      imgs = uniq(absImgs)
    // const imgs = await zipUrlExt(absImgs, getSaveDir(title))
    const res = {title, tags, imgs}
    return Promise.resolve(res)
  }
}
