/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/25
 */
'use strict'
const {logger} = require("../../middlewares/logger")
const axios = require("../axios_client")
const {load} = require("cheerio")
const {
  time_human_readable,
  zipWithIndex,
  extFormat,
  currMapLimit,
  url_resolve,
  mkdir,
  titleFormat,
} = require("../utils")
const {uniq, uniqBy} = require("lodash")
const path = require("path")
const {clip} = require("../../config/config")

module.exports = {
  get_dom,
  zipUrlExt,
  arrToAbsUrl,
  toAbsUrl,
  urlTextsToAbs,
  uniqUrlTexts,
  getSaveDir,
}

async function get_dom(url, handle_dom) {
  return await new Promise(async (resolve) => {
    const start = new Date()
    let res = {
      title: '', imgs: [], original: url, cost: 0,
      meta: undefined, tags: undefined,
    }
    logger.debug(`Getting image urls from ${url}`)
    await axios.get(url, {responseType: "document"})
      .then(res => res.data)
      .then(doc => load(doc))
      .then(async $ => res = await handle_dom($, url))
      .catch(e => {
        logger.debug(`Get ImageArray failed, url: ${url}`)
        logger.debug(e)
      })
      .finally(() => {
        const cost = new Date() - start
        const h_cost = time_human_readable(cost)
        logger.debug(`Get ImageArray: ${res.imgs.length} from ${url} cost: ${h_cost}`)
        res.cost = cost
        res.original = url
        return resolve(res)
      })
  })
}

async function zipUrlExt(imgArr, saveDir) {
  const uniqArr = uniq(imgArr)
  const zipArr = zipWithIndex(uniqArr)

  async function zipHandle(arr) {
    const url = arr[0], i = arr[1]
    const ext = await extFormat(url)
    const savePath = path.resolve(saveDir + path.sep + (i + 1) + ext)
    return {url, savePath}
  }

  return await currMapLimit(zipArr, clip.headLimit, zipHandle)
}

function arrToAbsUrl(urls, origin) {
  const base = new URL(origin).origin
  return urls.map(u => url_resolve(base, u))
}

function toAbsUrl(url, origin) {
  const base = new URL(origin).origin
  return url_resolve(base, url)
}

function urlTextsToAbs(url_texts, original) {
  return url_texts.map(raw => {
    let {url, text} = raw
    url = toAbsUrl(url, original)
    text = titleFormat(text)
    return {url, text}
  })
}

function uniqUrlTexts(url_texts) {
  url_texts = uniqBy(url_texts, 'url')
  url_texts = uniqBy(url_texts, 'text')
  return url_texts
}

function getSaveDir(title, create = true) {
  const fileDeep = '../../'
  const saveDir = path.resolve(__dirname, fileDeep, clip.baseDir, title)
  if (create) mkdir(saveDir)
  return saveDir
}