/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/25
 */
'use strict'

module.exports = {
  isSupport,
  filterSupStart,
  message_decode,
  handle_sup_url,
  getLimitByUrl,
  log_ph,
  log_related,
  log_url_texts,
  log_meta_tag,
}

const {time_human_readable} = require('../../libs/utils')
const download = require('../../libs/download')
const {uniqBy, uniq} = require('lodash')
const {clip} = require('../../config/config')

const supported = [
  'https://telegra.ph/',
  'https://everia.club/tag/',
  'https://everia.club/category/',
  'https://everia.club/',
  'https://www.24fa.com/search.aspx',
  'https://www.24fa.com/',
]
const supportHandle = [
  download.telegraph,
  download.eveiraTags,
  download.eveiraTags,
  download.eveira,
  download.fa24Tags,
  download.fa24,
]
const supportLimit = [
  clip.telegrafLimit,
  clip.eveLimit,
  clip.eveLimit,
  clip.eveLimit,
  clip.fa24Limit,
  clip.fa24Limit,
]
const special_url = /^https?:\/\/everia.club\/?$/

function isSupport(text) {
  return text && supported.some(_ => text.includes(_))
}

function filterSupStart(arr) {
  return arr.filter(_ => supported.some(s => _.startsWith(s)))
}

function message_decode(message) {
  let urls = []
  if (isSupport(message.text)) {
    const text = message.text
    urls = urls.concat(text.split('\n').filter(_ => isSupport(_)))
  }
  if (message.entities) {
    const text_link = message.entities
      .filter(_ => _.type === 'text_link')
      .map(_ => _.url)
      .filter(_ => isSupport(_))
    urls = urls.concat(text_link)
    const url = message.entities
      .filter(_ => _.type === 'url')
      .map(os => message.text.substring(os.offset, os.offset + os.length))
      .filter(_ => isSupport(_))
    urls = urls.concat(url)
  }
  urls = filterSupStart(uniq(urls.flat(Infinity)))
  return urls
}

function getIndexByUrl(url) {
  let idx = url.match(special_url) ? 1
    : supported.findIndex(_ => url.startsWith(_))
  if (idx === -1) {
    throw new Error(`No support handle for this url: ${url}`)
  }
  return idx
}

async function handle_sup_url(url) {
  let idx = getIndexByUrl(url)
  return supportHandle[idx].getImageArray(url)
}

function getLimitByUrl(url) {
  let idx = getIndexByUrl(url)
  return supportLimit[idx]
}

function log_ph(phs) {
  phs = uniqBy(phs, 'title')
  phs = uniqBy(phs, 'original')
  return phs
    .filter(_ => !!_)
    .map(ph => {
      const {title, imgs, original, cost} = ph
      return `[${title}](${original}): ${imgs.length} in ${time_human_readable(cost)}`
    }).join('\n')
}

function log_related(photos) {
  let related = photos.map(_ => _.related).flat(Infinity).filter(_ => !!_)
  if (related.length === 0) return ''
  related = uniqBy(related, 'text')
  related = uniqBy(related, 'url')
  let msg = `**#Related**\n`
  msg += log_url_texts(related)
  return msg
}

function log_url_texts(url_texts, sep = '\n') {
  if (!url_texts) return ''
  return url_texts
    .filter(_ => !!_)
    .map(_ => `[${_.text}](${_.url})`).join(sep)
}

function log_meta_tag(meta_tag, isMeta = false, sep = ', ') {
  if (!meta_tag || meta_tag.length === 0) return ''
  const res = log_url_texts(meta_tag, sep)
  return res ? `**${isMeta ? 'Meta' : 'Tags'}:**\n${res}\n` : ''
}