/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/25
 */
'use strict'
const path = require('path'),
  {uniq, uniqBy} = require('lodash'),
  {load} = require('cheerio')
const axios = require('../axios_client'),
  {clip} = require('../../config/config'),
  {logger} = require('../../middlewares/logger')
const {
  time_human_readable,
  zipWithIndex,
  extFormat,
  currMapLimit,
  url_resolve,
  mkdir,
  titleFormat,
} = require('../utils')

module.exports = {
  get_dom,
  getImgArr,
  getTagImgArr,
  zipUrlExt,
  arrToAbsUrl,
  toAbsUrl,
  urlTextsToAbs,
  uniqUrlTexts,
  getSaveDir,
  droppedPage,
}

async function get_dom(url, handle_dom) {
  return await new Promise(async (resolve) => {
    const start = new Date()
    let res = {
      title: '', imgs: [], original: url, cost: 0,
      meta: undefined, tags: undefined,
    }
    logger.debug(`Getting image urls from ${url}`)
    await axios.get(url, {
      responseType: 'document',
      headers: {
        'referer': url,
        Host: new URL(url).host,
        Connection: 'keep-alive',
      },
    })
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

async function getImgArr(url, handle_dom, handle_other_pages = undefined) {
  if (!handle_other_pages) {
    handle_other_pages = u => get_dom(u, handle_dom)
  }
  const firstPage = await get_dom(url, handle_dom)
  let {title, imgs, otherPages, related, cost, original, tags} = firstPage
  if (!otherPages || otherPages.length === 0) {
    return Promise.resolve(firstPage)
  }
  logger.debug(`Find another ${otherPages.length} pages, Get Image from other pages...`)
  const otherUrls = uniq(otherPages.map(p => p.url))
  const otherInfos = await currMapLimit(otherUrls, clip.pageLimit, handle_other_pages)
  imgs = uniq(imgs.concat(otherInfos.map(i => i.imgs)).flat(Infinity))
  if (related) {
    related = related.concat(otherInfos.map(i => i.related)).flat(Infinity)
    related = uniqBy(related, 'url')
  }
  cost += otherInfos.reduce((acc, i) => acc + i.cost, 0)
  const res = {title, imgs, related, cost, original, tags}
  return Promise.resolve(res)
}

async function getTagImgArr(url, getTagUrls, getImageArray, limit = clip.telegrafLimit) {
  const {title, url_texts, original, cost} = await getTagUrls(url)
  const urls = url_texts.map(_ => _.url)
  const time = time_human_readable(cost)
  logger.debug(`Get ${title} total ${urls.length} in ${time} from tag ${original}`)
  return await currMapLimit(urls, limit, getImageArray)
}


async function zipUrlExt(imgArr, saveDir, limit = clip.headLimit) {
  const uniqArr = uniq(imgArr)
  const zipArr = zipWithIndex(uniqArr)

  async function zipHandle(arr) {
    const url = arr[0], i = arr[1]
    try {
      const ext = await extFormat(url)
      const savePath = path.resolve(saveDir + path.sep + (i + 1) + ext)
      return {url, savePath}
    } catch (e) {
      logger.error("zipHandle", e)
      return {url, savePath: ""}
    }
  }

  return await currMapLimit(zipArr, limit, zipHandle)
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
    let {url, text, poster} = raw
    url = toAbsUrl(url, original)
    text = titleFormat(text)
    if (poster) {
      poster = toAbsUrl(poster, original)
    }
    return {...raw, url, text, poster}
  })
}

function uniqUrlTexts(url_texts) {
  url_texts = uniqBy(url_texts, 'url')
  url_texts = uniqBy(url_texts, 'text')
  return url_texts
}

function getSaveDir(title, baseDir = clip.baseDir, create = true) {
  const fileDeep = '../../'
  const saveDir = path.resolve(__dirname, fileDeep, baseDir, title)
  if (create) mkdir(saveDir)
  return saveDir
}

function droppedPage(url_texts,
                     denyPages = '上一页,下一页'.split(',')) {
  return url_texts.filter(p => !denyPages.some(d => p.text.includes(d)))
}