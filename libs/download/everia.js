/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const path = require('path'),
  urlN = require('url')
const axios = require('../axios_client'),
  {load} = require('cheerio'),
  {uniq} = require('lodash'),
  {logger} = require('../../middlewares/logger'),
  {clip} = require('../../config/config'),
  {mkdir, titleFormat, extFormat} = require('../utils')

async function getImageArray(url) {
  return await new Promise((resolve) => {
    logger.debug(`Getting image urls from ${url}`)
    let res = {title: '', meta: [], tags: [], imgs: [], original: url}
    axios.get(url, {
      responseType: "document",
    })
      .then(res => res.data)
      .then(doc => load(doc))
      .then(async $ => {
        const urlOrigin = new URL(url).origin

        const title = titleFormat($('.entry-header .title').text())
        const meta = $('.entry-header ul a').map((i, el) => $(el).text()).get()
        const tags = $('.nv-tags-list a').map((i, el) => $(el).text()).get()

        const saveDir = path.resolve(clip.baseDir + path.sep + title)
        mkdir(saveDir)
        let absISrcs = $('.entry-content img').map((_, el) => urlN.resolve(urlOrigin, el.attribs.src)).get()
        absISrcs = uniq(absISrcs)
        const imgSrc = []
        for (let i = 0; i < absISrcs.length; i++) {
          const absISrc = absISrcs[i]
          const ext = await extFormat(absISrc)
          imgSrc.push({
            url: absISrc,
            savePath: path.resolve(saveDir + path.sep + (i + 1) + ext),
          })
        }
        const imgs = imgSrc
        res = {title, meta, tags, imgs, original: url}
      })
      .catch(e => {
        logger.debug(`Get ImageArray failed, url: ${url}`)
        logger.debug(e)
      })
      .finally(() => {
        return resolve(res)
      })
  })
}

module.exports = getImageArray