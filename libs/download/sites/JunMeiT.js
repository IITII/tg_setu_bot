/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/07/02
 */
'use strict'

const path = require('path')
const {uniq} = require('lodash')
const {clip} = require('../../../config/config')
const {currMapLimit, titleFormat} = require('../../utils')
const {logger} = require('../../../middlewares/logger')
const {get_dom, droppedPage, uniqUrlTexts, urlTextsToAbs, arrToAbsUrl} = require('../dl_utils')

async function getImageArray(url) {
  const first_page = await get_dom(url, handle_dom)
  let {pos, title, meta, imgs, pages, tags, related, cost, original} = first_page
  const other_pages = calcOtherPages(pages),
    other_pages_res = await currMapLimit(other_pages, clip.pageLimit, handle_other_pages)
  imgs = uniq([imgs, other_pages_res.map(p => p.imgs)].flat(Infinity))
  related = uniqUrlTexts([related, other_pages_res.map(p => p.related)].flat(Infinity))
  cost += other_pages_res.reduce((acc, i) => acc + i.cost, 0)
  const res = {title, meta, tags, related, imgs, cost, original}
  return Promise.resolve(res)
}

function calcOtherPages(pages) {
  pages = droppedPage(pages)
  const allTextIsDigit = pages.every(page => /^\d+$/.test(page.text))
  let maxPage = 1
  if (allTextIsDigit) {
    maxPage = Math.max(...pages.map(page => parseInt(page.text) || 0))
  } else {
    logger.error(`calcOtherPages: unresolved: ${pages.filter(p => !/^\d+$/.test(p.text))}`)
    throw new Error(`calcOtherPages: unresolved pages`)
  }
  const {url} = pages[pages.length - 1]
  const ext = path.extname(url),
    no_ext = url.substring(0, url.length - ext.length),
    suffix = `-${maxPage}`
  let res = []
  if (no_ext.endsWith(suffix)) {
    const prefix = no_ext.substring(0, no_ext.length - suffix.length)
    for (let i = 1; i <= maxPage; i++) {
      res.push(`${prefix}-${i}${ext}`)
    }
  } else {
    throw new Error(`calcOtherPages: ${url}`)
  }
  return res
}

async function handle_other_pages(url) {
  return get_dom(url, handle_dom)
}

async function handle_dom($, original) {
  const pos = $('.position').text()
  const title = titleFormat($('.main .content .title').text())
  const metaR = $('.main .content .picture-details a').map((i, el) => {
      return {url: el.attribs.href, text: $(el).text()}
    }).get(),
    meta = urlTextsToAbs(metaR, original)
  const raw_imgs = $('.main .content .pictures img').map((i, el) => el.attribs.src).get(),
    imgs = arrToAbsUrl(raw_imgs, original)
  const pagesR = $('.main .content #pages a').map((i, el) => {
      return {url: el.attribs.href, text: $(el).text()}
    }).get(),
    pages_d = droppedPage(pagesR),
    pages = urlTextsToAbs(pages_d, original)
  const tagsR = $('.main .content .relation_tags a').map((i, el) => {
      return {url: el.attribs.href, text: $(el).text()}
    }).get(),
    tags = urlTextsToAbs(tagsR, original)
  const relatedR = $('.relations dd a').map((i, el) => {
      return {url: el.attribs.href, text: $(el).text()}
    }).get(),
    related = urlTextsToAbs(relatedR, original)
  const res = {pos, title, meta, imgs, pages, tags, related}
  return Promise.resolve(res)
}


module.exports = {
  getImageArray,
}