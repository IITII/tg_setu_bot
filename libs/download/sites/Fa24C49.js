/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/29
 */
'use strict'
const {get_dom, urlTextsToAbs} = require('../dl_utils')
const {titleFormat} = require('../../utils')

async function getTagUrls(url) {
  return get_dom(url, handle_dom)
}

async function handle_dom($, original) {
  const title_r = $('.tm .tk').text(),
    title = titleFormat(title_r)
  const url_text_r = $('#dlNews tr a').map((i, el) => {
      return {url: el.attribs.href, text: $(el).text()}
    }).get(),
    imgs = urlTextsToAbs(url_text_r, original)
  const res = {title, imgs}
  return Promise.resolve(res)
}

module.exports = {
  getTagUrls,
}