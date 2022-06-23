/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/23
 */
'use strict'
const axios = require('../../axios_client'),
  {load} = require('cheerio'),
  {uniqBy} = require('lodash')
const {clip} = require('../../../config/config'),
  {logger} = require('../../../middlewares/logger'),
  {currMapLimit} = require('../../utils'),
  dl_eve = require('../everia')

async function getTagImageArray(url) {
  return await new Promise((resolve) => {
    logger.debug(`Getting image urls from tag ${url}`)
    const original = url
    let res = {title: '', imgs: [], original}
    axios.get(url, {
      responseType: "document",
    })
      .then(res => res.data)
      .then(doc => load(doc))
      .then($ => {
        const title = $('.nv-page-title').text()
        const images = $('.posts-wrapper .entry-title a').map((index, el) => {
          return {index, url: el.attribs.href, title: $(el).text()}
        }).get()
        const imgs = uniqBy(images, 'url')
        res = {title, imgs, original}
      })
      .catch(e => {
        logger.debug(`Get ImageArray failed, tag url: ${url}`)
        logger.debug(e)
      })
      .finally(() => {
        return resolve(res)
      })
  })
}

async function getImageArray(url) {
  let {title, imgs, original} = await getTagImageArray(url)
  const urls = imgs.map(img => img.url)
  logger.debug(`Get ${title} total ${urls.length} urls from tag ${original}`)
  return await currMapLimit(urls, clip.tagLimit, dl_eve)
}


module.exports = getImageArray