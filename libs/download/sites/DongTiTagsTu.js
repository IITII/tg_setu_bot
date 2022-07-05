/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/07/06
 */
'use strict'
const {clip} = require('../../../config/config')
const dongTi = require('./DongTi'),
  {get_dom, urlTextsToAbs} = require('../dl_utils'),
  {logger} = require('../../../middlewares/logger'),
  {titleFormat, time_human_readable, currMapLimit} = require('../../utils')

async function getImageArray(url) {
  const {title, imgs, original, cost} = await getTagUrls(url)
  const urls = imgs.map(_ => _.url)
  const time = time_human_readable(cost)
  logger.debug(`Get ${title} total ${urls.length} in ${time} from tag ${original}`)
  return await currMapLimit(urls, clip.dongTiTagLimit, dongTi.getImageArray)
}

async function getTagUrls(url) {
  return get_dom(url, handle_dom)
}

async function handle_dom($, original) {
  const title = titleFormat($('.main .sec-panel-head h1').text())
  const imgsR = $('.main .sec-panel-body .item .item-thumb').map((i, el) => {
      const url = el.attribs.href
      const text = el.attribs.title
      const poster = $(el).find('img').get(0).attribs['data-original']
      return {url, text, poster}
    }).get(),
    imgs = urlTextsToAbs(imgsR, original)
  const res = {title, imgs}
  return Promise.resolve(res)
}

module.exports = {
  getTagUrls,
  getImageArray,
}
