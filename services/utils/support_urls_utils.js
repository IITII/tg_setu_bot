/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/27
 */
'use strict'
const {clip} = require('../../config/config'),
  download = require('../../libs/download')

const supRaw = [
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
    [
      'https://junmeitu.com/tags/',
      'https://junmeitu.com/xzjg/',
      'https://junmeitu.com/model/',
      'https://junmeitu.com/beauty/hot-1.html',
      'https://www.junmeitu.com/tags/',
      'https://www.junmeitu.com/xzjg/',
      'https://www.junmeitu.com/model/',
      'https://www.junmeitu.com/beauty/hot-1.html',
    ],
    [
      'https://junmeitu.com/beauty/',
      'https://www.junmeitu.com/beauty/'
    ],
  ],
  supRaw_flat = supRaw.flat(Infinity),
  handle_limit = [
    [download.telegraph, clip.telegrafLimit],
    [download.eveiraTags, clip.eveLimit],
    [download.eveira, clip.eveLimit],
    [download.fa24Tags, clip.fa24Limit],
    [download.fa24, clip.fa24Limit],
    [download.junMeiTags, clip.junMeiLimit],
    [download.junMei, clip.junMeiLimit],
  ]
const special_url = [
  [/^https?:\/\/everia\.club\/?$/, 1],
  [/^https?:\/\/junmeitu\.com\/beauty\/?$/, 5],
  [/^https?:\/\/www\.junmeitu\.com\/beauty\/?$/, 5]
]

function isSupport(text) {
  return text && supRaw_flat.some(_ => text.includes(_))
}

function filterSupStart(arr, img_or_tags = 'mix') {
  const mix = arr.filter(_ => supRaw_flat.some(s => _.startsWith(s)))
  let allowArr = []
  switch (img_or_tags) {
    case 'img':
      allowArr = [0, 2, 4, 6]
      break
    case 'tags':
      allowArr = [1, 3, 5]
      break
    case 'mix':
    default:
      // allowArr = [0, 1, 2, 3, 4]
      break
  }
  return allowArr.length === 0 ? mix : mix.filter(_ => allowArr.includes(getIndexByUrl(_)))
}

function getIndexByUrl(url,
                       specArr = special_url,
                       rawArr = supRaw) {
  let idx
  const i = specArr.findIndex(_ => _[0].test(url))
  if (i > -1) {
    idx = specArr[i][1]
  } else {
    idx = rawArr.findIndex(_ => _.some(s => url.startsWith(s)))
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
  getIndexByUrl,
}