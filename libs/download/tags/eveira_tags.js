/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/23
 */
'use strict'
const {uniqBy} = require('lodash')
const AbsDownloader = require("../AbsDownloader");
const {get_dom} = require("../dl_utils");
const {clip} = require('../../../config/config'),
    {logger} = require('../../../middlewares/logger'),
    {currMapLimit, titleFormat, time_human_readable} = require('../../utils'),
    Eveira = require('../Eveira'),
    eveira = new Eveira()

module.exports = class EveiraTags extends AbsDownloader {
    async getImageArray(url) {
        const {title, imgs, original, cost} = await get_dom(url, this.handle_dom)
        const urls = imgs.map(_ => _.url)
        const time = time_human_readable(cost)
        logger.debug(`Get ${title} total ${urls.length} in ${time} from tag ${original}`)
        return await currMapLimit(urls, clip.tagLimit, eveira.getImageArray)
    }

    async handle_dom($, original) {
        const title = titleFormat($('.nv-page-title').text())
        const images = $('.posts-wrapper .entry-title a').map((index, el) => {
            return {index, url: el.attribs.href, title: $(el).text()}
        }).get()
        const imgs = uniqBy(images, 'url')
        const res = {title, imgs}
        return Promise.resolve(res)
    }
}