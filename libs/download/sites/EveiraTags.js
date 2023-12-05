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
    let title = $('title').text()?.replace(/– ?EVERIA\.CLUB/, '')
    title = title.replace(/["“”]/g, '').replace('Search Results for', '')
    title = titleFormat(title)
    let s1 = $('#blog-entries article .thumbnail a'),
      s2 = $('#content .thumbnail a'),
      s3 = s1.length > 0 ? s1 : s2
    let images = s3.map((_, el) => {
      const poster = $(el).find('img').get(0)?.attribs['data-src'] || $(el).find('img').get(0)?.attribs.src
      let text = $(el).find('img').get(0)
      text = text?.attribs.title || text?.attribs.alt
      text = text.replace(/Read more about the article/, '').trim()
      return {url: el.attribs.href, text, poster}
    }).get()
    images = uniqUrlTexts(images)
    let imgs = urlTextsToAbs(images, original)
    const res = {title, imgs}
    return Promise.resolve(res)
  }
}
