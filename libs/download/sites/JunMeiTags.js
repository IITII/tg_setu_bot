/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/07/03
 */
'use strict'

const {get_dom, urlTextsToAbs} = require('../dl_utils')
const {titleFormat, time_human_readable, currMapLimit} = require('../../utils')
const {logger} = require('../../../middlewares/logger')
const {clip} = require('../../../config/config')
const junMei = require('./JunMei')

async function getTagUrls(url) {
  return get_dom(url, handle_dom)
}

async function handle_dom($, original) {
  const title = titleFormat($($('.position a').get(2)).text())
  const url_text_r = $('.pic-list li a').map((i, el) => {
      const poster = $(el).find('img').get(0).attribs.src
      return {url: el.attribs.href, text: $(el).text(), poster}
    }).get(),
    imgs = urlTextsToAbs(url_text_r, original)
  // const pages = $('.pic-list .pages a').map((i, el) => {
  //     return { url: el.attribs.href, text: $(el).text() }
  // }).get()
  const res = {title, imgs}
  return Promise.resolve(res)
}

async function getImageArray(url) {
  const {title, imgs, original, cost} = await this.getTagUrls(url)
  const urls = imgs.map(_ => _.url)
  const time = time_human_readable(cost)
  logger.debug(`Get ${title} total ${urls.length} in ${time} from tag ${original}`)
  return await currMapLimit(urls, clip.junMeiTagLimit, junMei.getImageArray)
}

module.exports = {
  getTagUrls,
  getImageArray,
}