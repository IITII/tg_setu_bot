/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/27
 */
'use strict'
const AbsDownloader = require('../AbsDownloader'),
  Fa24 = require('./Fa24'),
  fa24 = new Fa24()
const {get_dom, urlTextsToAbs} = require('../dl_utils'),
  {currMapLimit, time_human_readable, titleFormat} = require('../../utils'),
  {clip} = require('../../../config/config'),
  {logger} = require('../../../middlewares/logger')
let self = null

module.exports = class Fa24Tags extends AbsDownloader {
  constructor() {
    super()
    self = this
  }

  async getImageArray(url) {
    const {title, imgs, original, cost} = await this.getTagUrls(url)
    const urls = imgs.map(_ => _.url)
    const time = time_human_readable(cost)
    logger.debug(`Get ${title} total ${urls.length} in ${time} from tag ${original}`)
    return await currMapLimit(urls, clip.faTagLimit, fa24.getImageArray)
  }

  async getTagUrls(url) {
    return get_dom(url, this.handle_dom)
  }

  async handle_dom($, original) {
    const titleR = $('#middle .tmm b').text(),
      title = titleFormat(titleR)
    let posters = $('.sumlist .title img').map((_, el) => el.attribs.src).get()
    const url_text_r = $('.sumlist .title a').map((i, el) => {
        const poster = posters[i]
        return {url: el.attribs.href, text: $(el).text(), poster}
      }).get(),
      imgs = urlTextsToAbs(url_text_r, original)
    const res = {title, imgs}
    return Promise.resolve(res)
  }
}