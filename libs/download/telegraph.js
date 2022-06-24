/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const path = require('path')
const axios = require('../axios_client'),
  {load} = require('cheerio'),
  {uniq} = require('lodash'),
  {logger} = require('../../middlewares/logger'),
  {clip} = require('../../config/config'),
  {mkdir, titleFormat, extFormat, zipWithIndex, currMapLimit} = require('../utils')

async function getImageArray(url) {
  return await new Promise((resolve) => {
    logger.debug(`Getting image urls from ${url}`)
    const start = new Date()
    axios.get(url, {
      responseType: "document",
    })
      .then(res => res.data)
      .then(doc => load(doc))
      .then(async $ => {
        const title = titleFormat($('header h1').text())
        const saveDir = path.resolve(clip.baseDir + path.sep + title)
        mkdir(saveDir)
        let absISrcs = $('img').map((_, el) => new URL(url).origin + el.attribs.src).get()
        absISrcs = uniq(absISrcs)
        absISrcs = zipWithIndex(absISrcs)
        async function zipHandle(arr) {
          const absISrc = arr[0],
            i = arr[1]
          const ext = await extFormat(absISrc)
          return {
            url: absISrc,
            savePath: path.resolve(saveDir + path.sep + (i + 1) + ext),
          }
        }
        const imgs = await currMapLimit(absISrcs, clip.headLimit, zipHandle)
        const cost = new Date() - start
        return resolve({title, imgs, original: url, cost})
      })
      .catch(e => {
        logger.debug(`Get ImageArray failed, url: ${url}`)
        logger.debug(e)
        return resolve({title: '', imgs: [], original: url, cost: 0})
      })
  })
}

module.exports = getImageArray