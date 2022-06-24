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
  {mkdir, titleFormat, extFormat} = require('../utils')

async function getImageArray(url) {
  return await new Promise((resolve) => {
    logger.debug(`Getting image urls from ${url}`)
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
        return resolve({title, imgs, original: url})
      })
      .catch(e => {
        logger.debug(`Get ImageArray failed, url: ${url}`)
        logger.debug(e)
        return resolve({title: '', imgs: [], original: url})
      })
  })
}

module.exports = getImageArray