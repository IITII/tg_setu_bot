/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const {titleFormat} = require('../utils')
const {getSaveDir, zipUrlExt, toAbsUrl} = require("./dl_utils");
const AbsDownloader = require("./AbsDownloader");

module.exports = class Eveira extends AbsDownloader {
    async handle_dom($, original) {
        const title = titleFormat($('.entry-header .title').text())
        const meta = $('.entry-header ul a').map((i, el) => $(el).text()).get()
        const tags = $('.nv-tags-list a').map((i, el) => $(el).text()).get()
        const rawImgs = $('.entry-content img').map((i, el) => el.attribs.src).get()
        const absImgs = toAbsUrl(rawImgs, original)
        const imgs = await zipUrlExt(absImgs, getSaveDir(title))
        const res = {title, meta, tags, imgs}
        return Promise.resolve(res)
    }
}