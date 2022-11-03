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
      'https://www.junmeitu.com/beauty/',
    ],
    [
      'https://www.javbus.com/star/',
      'https://www.javbus.com/uncensored/star/',
    ],
    [
      'https://dongtidemi.com/category/tu/xiezhen',
      'https://dongtidemi.com/category/tu/%e7%a6%8f%e5%88%a9%e5%a7%ac',
      'https://dongtidemi.com/category/tu/cos',
      'https://dongtidemimi.org/category/tu/xiezhen',
      'https://dongtidemimi.org/category/tu/%e7%a6%8f%e5%88%a9%e5%a7%ac',
      'https://dongtidemimi.org/category/tu/cos',
      'https://dongtidemimi.org/category/tu/tu2',
      'https://dongti2022.com/category/tu/xiezhen',
      'https://dongti2022.com/category/tu/%e7%a6%8f%e5%88%a9%e5%a7%ac',
      'https://dongti2022.com/category/tu/cos',
      'https://dongti2022.com/category/tu/tu2',
    ],
    [
      'https://dongtidemi.com/tag/',
      'https://dongtidemi.com/?s=',
      'https://dongtidemi.com/category/tu',
      'https://dongtidemimi.org/tag/',
      'https://dongtidemimi.org/?s=',
      'https://dongtidemimi.org/category/tu',
      'https://dongti2022.com/tag/',
      'https://dongti2022.com/?s=',
      'https://dongti2022.com/category/tu',
    ],
    [
      'https://dongtidemi.com/',
      'https://dongtidemimi.org/',
      'https://dongti2022.com/',
    ],
    [
      'https://theasiagirl.com/tag/',
      'https://theasiagirl.com/?s=',
    ],
    [
      'https://theasiagirl.com/',
    ],
    [
      'https://buondua.com/?search=',
      'https://buondua.com/tag/',
    ],
    [
      'https://buondua.com/'
    ],
    [
      'https://tu.acgbox.org/index.php/category/',
      'https://tu.acgbox.org/index.php/search/',
    ],
    [
      'https://tu.acgbox.org/index.php/archives/',
    ],
    [
      'https://www.jdlingyu.com/collection/',
      'https://www.jdlingyu.com/tag/',
    ],
    [
      'https://www.jdlingyu.com/',
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
    [download.busTags, clip.busTagLimit],
    [download.dongTiTagsTu, clip.dongTiTagLimit],
    [download.dongTiTags, clip.dongTiTagLimit],
    [download.dongTi, clip.dongTiLimit],
    [download.asiaGTags, clip.asiaGTagsLimit],
    [download.asiaG, clip.asiaGLimit],
    [download.duaTags, clip.duaTagsLimit],
    [download.dua, clip.duaLimit],
    [download.AcgBoxTags, clip.meiTagsLimit],
    [download.AcgBox, clip.meiLimit],
    [download.JdyTags, clip.meiLimit],
    [download.Jdy, clip.meiLimit],
  ]
const special_url = [
  [/^https?:\/\/everia\.club\/?$/, 1],
  [/^https?:\/\/junmeitu\.com\/beauty\/?$/, 5],
  [/^https?:\/\/www\.junmeitu\.com\/beauty\/?$/, 5],
  [/^https?:\/\/www\.javbus\.com\/?$/, 7],
  [/^https?:\/\/theasiagirl\.com\/?$/, 11],
  [/^https?:\/\/buondua\.com\/?$/, 13],
  [/^https?:\/\/buondua\.com\/hot\/?$/, 13],
  [/^https?:\/\/tu\.acgbox\.org\/index\.ph\/?p$/, 15],
  [/^https?:\/\/tu\.acgbox\.org\/?p$/, 15],
]

let distinct_host = supRaw_flat.map(u => new URL(u))
  .map(u => `${u.protocol}//${u.username}:${u.password}@${u.host}`)
  .map(u => new URL(u).toString())
distinct_host = [...new Set(distinct_host)].sort()

function filter_deny_urls(arr, deny = []) {
  return arr.filter(u => {
    return !(distinct_host.some(d => d === u) || deny.some(d => d === u))
  })
}

function isSupport(text) {
  return text && supRaw_flat.some(_ => text.includes(_))
}

function filterSupStart(arr, img_or_tags = 'mix') {
  const mix = arr.filter(_ => supRaw_flat.some(s => _.startsWith(s)))
  let allowArr = []
  switch (img_or_tags) {
    case 'img':
      allowArr = [0, 2, 4, 6, 10, 12, 14, 16, 18]
      break
    case 'tags':
      allowArr = [1, 3, 5, 8, 9, 11, 13, 15, 17]
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
  filter_deny_urls,
}