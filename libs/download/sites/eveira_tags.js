/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/23
 */
'use strict'
const AbsDownloader = require('../AbsDownloader')
const {get_dom, urlTextsToAbs, uniqUrlTexts} = require('../dl_utils')
const {clip} = require('../../../config/config'),
  {logger} = require('../../../middlewares/logger'),
  {currMapLimit, titleFormat, time_human_readable} = require('../../utils'),
  Eveira = require('./Eveira'),
  eveira = new Eveira()

module.exports = class EveiraTags extends AbsDownloader {
  async getImageArray(url) {
    const {title, imgs, original, cost} = await this.getTagUrls(url)
    const urls = imgs.map(_ => _.url)
    const time = time_human_readable(cost)
    logger.debug(`Get ${title} total ${urls.length} in ${time} from tag ${original}`)
    return await currMapLimit(urls, clip.eveTagLimit, this.keep_this)
  }

  async keep_this(url) {
    return eveira.getImageArray(url)
  }

  async getTagUrls(url) {
    return get_dom(url, this.handle_dom)
  }

  async handle_dom($, original) {
    const title = titleFormat($('.nv-page-title').text())
    let images = $('.posts-wrapper .entry-title a').map((_, el) => {
      return {url: el.attribs.href, text: $(el).text()}
    }).get()
    images = uniqUrlTexts(images)
    let imgs = urlTextsToAbs(images, original)
    const res = {title, imgs}
    return Promise.resolve(res)
  }
}