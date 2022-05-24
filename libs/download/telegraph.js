/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const path = require('path'),
  fs = require('fs')
const axios = require('../axios_client'),
  {load} = require('cheerio'),
  {uniq} = require('lodash'),
  {logger} = require('../../middlewares/logger'),
  {clip} = require('../../config/config'),
  {mkdir} = require('../utils')

async function getImageArray(url) {
  return await new Promise((resolve) => {
    logger.debug(`Getting image urls from ${url}`)
    axios.get(url, {
      responseType: "document",
    })
      .then(res => res.data)
      .then(doc => load(doc))
      .then($ => {
        const title = $('header h1').text()
        const saveDir = path.resolve(clip.baseDir + path.sep + title)
        mkdir(saveDir)
        const imgSrc = []
        $("img").each((index, item) => {
          imgSrc.push({
            url: new URL(url).origin + item.attribs.src,
            savePath: path.resolve(saveDir + path.sep + (index + 1) + path.extname(item.attribs.src)),
          })
        })
        return resolve({title: title, imgs: uniq(imgSrc), original: url})
      })
      .catch(e => {
        logger.debug(`Get ImageArray failed, url: ${url}`)
        logger.debug(e)
        return resolve({title: '', imgs: [], original: url})
      })
  })
}

module.exports = getImageArray