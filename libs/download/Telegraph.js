/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const {titleFormat} = require('../utils')
const AbsDownloader = require("./AbsDownloader");
const {zipUrlExt, getSaveDir, toAbsUrl} = require("./dl_utils");

module.exports = class Telegraph extends AbsDownloader {
    async handle_dom($, original) {
        const title = titleFormat($('header h1').text())
        const rawImgs = $('img').map((_, el) => el.attribs.src).get()
        const absImgs = toAbsUrl(rawImgs, original)
        const imgs = await zipUrlExt(absImgs, getSaveDir(title))
        const res = {title, imgs}
        return Promise.resolve(res)
    }
}