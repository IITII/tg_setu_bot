/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/25
 */
'use strict'
const path = require('path'),
  {uniq, uniqBy} = require('lodash'),
  cloudscraper = require('cloudscraper'),
  {load} = require('cheerio')
const {axios} = require('../axios_client'),
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
const encoding = require('encoding')

module.exports = {
  get_dom,
  post_dom,
  getImgArr,
  getTagImgArr,
  zipUrlExt,
  arrToAbsUrl,
  toAbsUrl,
  urlTextsToAbs,
  uniqUrlTexts,
  getSaveDir,
  droppedPage,
  format_origin,
}

async function get_dom(url, handle_dom, cf) {
  return await new Promise(async (resolve) => {
    const start = new Date()
    let res = {
      title: '', imgs: [], original: url, cost: 0,
      meta: undefined, tags: undefined,
    }
    logger.debug(`Getting image urls from ${url}`)
    let dom
    if (cf) {
      // no support proxy
      dom = cloudscraper(url)
        .then(res => load(res))
    } else {
      dom = axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
          'referer': url,
          Host: new URL(url).host,
          Connection: 'keep-alive',
        },
      })
        .then(res => {
          let buf = res.data
          let utf8 = 'utf8'
          let try_utf8 = buf.toString()
          let $ = load(try_utf8)
          let content = $('meta[http-equiv="Content-Type" i]').attr('content')?.split(';').pop().split('=').pop()
          content = content?.replace(/-_/g, '').toLowerCase()
          if (content && content !== utf8) {
            try {
              buf = encoding.convert(buf, utf8, content)
            } catch (e) {
              buf = encoding.convert(buf, utf8, 'GBK')
            }
            $ = load(buf.toString())
          }
          return $
        })
    }
    dom.then(async $ => res = await handle_dom($, url))
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

async function post_dom(url, postBody, handle_dom, handle_error, parse, retry, original, cookies = undefined) {
  original = original || url
  return await new Promise(async resolve => {
    const start = new Date()
    let res = {
      title: '', imgs: [], original, cost: 0,
      meta: undefined, tags: undefined,
    }
    logger.debug(`Getting image urls from ${url}`)
    await axios.post(url, postBody, {
      responseType: 'document',
      headers: {
        'referer': original,
        Host: new URL(url).host,
        Connection: 'keep-alive',
        Cookie: cookies,
      },
    })
      .then(res => load(res?.data))
      .then(async $ => res = await handle_dom($, url))
      .catch(async e => {
        if (handle_error && retry < 3 && e?.response?.status === 403) {
          let e_dom = parse ? await load(e.response.data) : e
          logger.debug(`Get --------------, url: ${e.response.data.split('\n').filter(_ => _.includes('gallery')).length}`)
          res = await handle_error(e_dom, url, e, retry)
        } else {
          logger.debug(`Get ImageArray failed, url: ${url}`)
          logger.debug(e)
        }
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

function format_origin(url, protectKey = '_') {
  let u, origin = url
  u = new URL(url)
  if (u.searchParams.has(protectKey)) {
    u.searchParams.delete(protectKey)
    origin = u.toString()
    logger.info(`[AcgBox] format_origin: ${url} -> ${origin}`)
  }
  return origin
}


async function getImgArr(url, handle_dom, handle_other_pages = undefined, cf = false) {
  if (!handle_other_pages) {
    handle_other_pages = u => get_dom(u, handle_dom, cf)
  }
  const firstPage = await get_dom(url, handle_dom, cf)
  let {title, imgs, otherPages, related, cost, original, tags, external} = firstPage
  if (!otherPages || otherPages.length === 0) {
    return Promise.resolve(firstPage)
  }
  logger.debug(`Find another ${otherPages.length} pages, Get Image from other pages...`)
  let otherInfos, visited = new Map(), unvisited = []
  visited.set(original, true)
  // update unvisited
  unvisited = uniq(otherPages.map(p => p.url))
  do {
    // request to get other pages
    otherInfos = await currMapLimit(unvisited, clip.pageLimit, handle_other_pages)
    imgs = uniq(imgs.concat(otherInfos.map(i => i.imgs)).flat(Infinity))
    if (related) {
      related = related.concat(otherInfos.map(i => i.related)).flat(Infinity)
      related = uniqBy(related, 'url')
    }
    cost += otherInfos.reduce((acc, i) => acc + i.cost, 0)
    // update visited
    unvisited.forEach(u => visited.set(u, true))
    let otherInfoUrls = otherInfos.map(i => i.otherPages).flat(Infinity)
    otherInfoUrls = otherInfoUrls.filter(_ => !!_ && !!_.url)
    otherInfoUrls = otherInfoUrls.map(p => p.url)
    otherInfoUrls = uniq(otherInfoUrls).sort()
    // update unvisited
    unvisited = otherInfoUrls.filter(u => !visited.has(u))
  } while (unvisited.length > 0)
  const res = {title, imgs, related, cost, original, tags, external}
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
      logger.error('zipHandle', e)
      return {url, savePath: ''}
    }
  }

  return await currMapLimit(zipArr, limit, zipHandle)
}

function arrToAbsUrl(urls, origin) {
  return urls.map(u => toAbsUrl(u, origin))
}

function toAbsUrl(url, origin) {
  let base = url.startsWith('/') ? new URL(origin).origin : origin
  return url_resolve(base, url)
}

function urlTextsToAbs(url_texts, original, uniq = false) {
  url_texts = url_texts.filter(_ => _.url && _.text)
  let dup = url_texts.map(raw => {
    let {url, text, poster} = raw
    url = toAbsUrl(url, original)
    text = titleFormat(text)
    if (poster) {
      poster = toAbsUrl(poster, original)
    }
    return {...raw, url, text, poster}
  })
  if (uniq) {
    'url'
      // 'url,text'
      .split(',').forEach(e => {
      dup = uniqBy(dup, e)
    })
  }
  return dup
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
