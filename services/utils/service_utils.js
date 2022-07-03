/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/25
 */
'use strict'

module.exports = {
  message_decode,
  log_ph,
  log_related,
  log_url_texts,
  log_meta_tag,
}

const {time_human_readable} = require('../../libs/utils')
const {uniqBy, uniq} = require('lodash')
const {isSupport, filterSupStart} = require('./support_urls_utils')

function message_decode(message, img_or_tags = 'mix') {
  let urls = []
  const raw = [
    {text: message.text, entities: message.entities},
    {text: message.caption, entities: message.caption_entities},
  ]
  raw.forEach(({text, entities}) => {
    if (isSupport(text)) {
      urls.push(text.split('\n'))
    }
    if (entities) {
      const text_link = entities
        .filter(_ => _.type === 'text_link')
        .map(_ => _.url)
      const url = entities
        .filter(_ => _.type === 'url')
        .map(os => text.substring(os.offset, os.offset + os.length))
      urls.push(text_link, url)
    }
  })
  urls = filterSupStart(uniq(urls.flat(Infinity)), img_or_tags)
  return urls
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