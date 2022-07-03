/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/07/03
 */
'use strict'
const {urlTextsToAbs, get_dom} = require('../dl_utils')

async function getTagUrls(url) {
  return get_dom(url, handle_dom)
}

async function handle_dom($, original) {
  const title = 'Bus'
  const movies = $('#waterfall .movie-box').map((i, el) => {
      const poster = $(el).find('img').get(0).attribs.src
      const url = el.attribs.href
      let text = $(el).text()
        .split('\n')
        .map(_ => _.trim())
        .filter(_ => _.length > 0)
      text = [text[0], text[text.length - 1]].join(' ')
      return {url, text, poster}
    }).get(),
    imgs = urlTextsToAbs(movies, original)
  const res = {title, imgs}
  return Promise.resolve(res)
}

module.exports = {
  getTagUrls,
}