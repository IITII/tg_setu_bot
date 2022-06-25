/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/25
 */
'use strict'

module.exports = {
  isSupport,
  filterSupStart,
  handle_sup_url,
  log_ph,
  log_related,
}

const {time_human_readable} = require('../libs/utils')
const download = require('../libs/download')

const supported = [
  'https://telegra.ph/',
  'https://everia.club/tag/',
  'https://everia.club/category/',
  'https://everia.club/',
  'https://www.24fa.com/',
  'https://www.268w.cc/',
  'https://www.116w.cc/',
  'https://www.268w.cc/',
]
const supportHandle = [
  download.telegraph,
  download.eveiraTags,
  download.eveiraTags,
  download.eveira,
  download.fa24,
  download.fa24,
  download.fa24,
  download.fa24,
]
const special_url = /^https?:\/\/everia.club\/?$/

function isSupport(text) {
  return text && supported.some(_ => text.includes(_))
}

function filterSupStart(arr) {
  return arr.filter(_ => supported.some(s => _.startsWith(s)))
}

async function handle_sup_url(url) {
  let idx = url.match(special_url) ? 1
    : supported.findIndex(_ => url.startsWith(_))
  if (idx === -1) {
    throw new Error(`No support handle for this url: ${url}`)
  }
  return supportHandle[idx].getImageArray(url)
}

function log_ph(phs) {
  return phs.map(ph => {
    const {title, imgs, original, cost} = ph
    return `[${title}](${original}): ${imgs.length} in ${time_human_readable(cost)}`
  }).join('\n')
}

function log_related(related, title, original) {
  let msg = `**Related by [${title}](${original}):**\n`
  msg += related.map(re => {
    const {url, text} = re
    return `[${text}](${url})`
  }).join('\n')
  return msg
}