/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/27
 */
'use strict'
const {clip} = require('../../config/config'),
  download = require('../../libs/download')

const special_url = /^https?:\/\/everia.club\/?$/,
  supRaw = [
    [
      'https://telegra.ph/',
    ],
    [
      'https://everia.club/tag/',
      'https://everia.club/category/',
    ],
    [
      'https://everia.club/',
    ],
    [
      'https://www.24fa.com/search.aspx',
      'https://www.268w.cc/search.aspx',
      'https://www.116w.cc/search.aspx',
    ],
    [
      'https://www.24fa.com/',
      'https://www.268w.cc/',
      'https://www.116w.cc/',
    ],
  ],
  supRaw_flat = supRaw.flat(Infinity),
  handle_limit = [
    [download.telegraph, clip.telegrafLimit],
    [download.eveiraTags, clip.eveLimit],
    [download.eveira, clip.eveLimit],
    [download.fa24Tags, clip.fa24Limit],
    [download.fa24, clip.fa24Limit],
  ]
//   sup_handle_limit = get_sup_handle_limit()
//
// function get_sup_handle_limit() {
//   const res = []
//   for (let i = 0; i < supRaw.length; i++) {
//     let sup = supRaw[i]
//     sup = sup.map(u => {
//       u = new URL(u)
//       return {origin: u.origin, pathname: u.pathname}
//     })
//     const single = {
//       origin: sup.map(_ => _.origin),
//       pathname: sup.map(_ => _.pathname),
//       handle: i
//     }
//     res.push(single)
//   }
//   return res
// }

function isSupport(text) {
  return text && supRaw_flat.some(_ => text.includes(_))
}

function filterSupStart(arr) {
  return arr.filter(_ => supRaw_flat.some(s => _.startsWith(s)))
}

function getIndexByUrl(url) {
  let idx
  if (url.match(special_url)) {
    idx = 1
  } else {
    idx = supRaw.findIndex(_ => _.some(s => url.startsWith(s)))
  }
  if (idx === -1) {
    throw new Error(`No support handle for this url: ${url}`)
  }
  return idx
}

async function handle_sup_url(url) {
  let idx = getIndexByUrl(url)
  return handle_limit[idx][0].getImageArray(url)
}

function getLimitByUrl(url) {
  let idx = getIndexByUrl(url)
  return handle_limit[idx][1]
}

module.exports = {
  isSupport,
  filterSupStart,
  handle_sup_url,
  getLimitByUrl,
}