/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/27
 */
'use strict'
const {clip} = require('../../config/config'),
  download = require('../../libs/download')

/**
 * 二维数组形式, 按 tag/搜索, 详情页 格式排序.
 * tag/搜索 之类的网址放前面
 */
const supRaw = [
    ['https://telegra.ph/',],
    [
      'https://everia.club/tag/',
      'https://everia.club/category/',
      'https://everia.club/?s=',
    ],
    ['https://everia.club/',],
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
      'https://dongti233.com/category/tu/xiezhen',
      'https://dongti233.com/category/tu/%e7%a6%8f%e5%88%a9%e5%a7%ac',
      'https://dongti233.com/category/tu/cos',
      'https://dongti233.com/category/tu/tu2',
      'https://dongti233.com/category/tu',
    ],
    [
      'https://dongti233.com/tag/',
      'https://dongti233.com/?s=',
    ],
    [
      'https://dongti233.com/',
    ],
    [
      'https://theasiagirl.com/tag/',
      'https://theasiagirl.com/?s=',
    ],
    ['https://theasiagirl.com/',],
    [
      'https://buondua.com/?search=',
      'https://buondua.com/tag/',
      'https://buondua.com/hot',
    ],
    ['https://buondua.com/',],
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
    ['https://www.jdlingyu.com/',],
    [
      'https://www.muweishe.com/meizitu/',
      'https://www.muweishe.com/tag/',
    ],
    ['https://www.muweishe.com/',],
    [
      'https://tmdpic.com/category/',
      'https://tmdpic.com/tags/',
    ],
    ['https://tmdpic.com/html/',],
    [
      'https://xx.knit.bid/sort',
      'https://xx.knit.bid/tag/',
      'https://xx.knit.bid/type/',
      'https://xx.knit.bid/search/',
    ],
    ['https://xx.knit.bid/article/',],
    [
      // 'https://jablehk.com/hongkonggirls',
      // 'https://jablehk.com/taiwangirls',
      // 'https://jablehk.com/koreanjapangirls',
      // 'https://jablehk.com/southeastasiangirls',
      // 'https://jablehk.com/adult',
    ],
    ['https://jablehk.com/'],
    [
      'https://asiantolick.com/category',
      'https://asiantolick.com/tag',
      'https://asiantolick.com/search/',
      'https://asiantolick.com/page/',
    ],
    ['https://asiantolick.com/post',],
    [],
    ['https://www.mmm131.com/',],
    ['https://www.4kup.net/search?q='],
    ['https://www.4kup.net/',],
    ['https://www.hentaicomic.ru/search/?q=', 'https://www.hentaicomic.ru/albums-index-cate-3.html'],
    ['https://www.hentaicomic.ru/',],
  ],
  // flat 之后方便判断用户输入的网址是否支持
  supRaw_flat = supRaw.flat(Infinity),
  // 和网址一一对应, 指定 handler 和 limit
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
    [download.MuWeiTags, clip.meiLimit],
    [download.MuWei, clip.meiLimit],
    [download.tmdPicTags, clip.tmdTagsLimit],
    [download.tmdPic, clip.tmdLimit],
    [download.knitTags, clip.knitTagsLimit],
    [download.knit, clip.knitLimit],
    [download.jableTags, clip.jableTagsLimit],
    [download.jable, clip.jableLimit],
    [download.asianTags, clip.asianTagsLimit],
    [download.asian, clip.asianLimit],
    [download.m131Tags, clip.m131TagsLimit],
    [download.m131, clip.m131Limit],
    [download.kupTags, clip.kupTagsLimit],
    [download.kup, clip.kupLimit],
    [download.hentaiComicTags, clip.hentaiComicTagsLimit],
    [download.hentaiComic, clip.hentaiComicLimit],
  ]
// 特定 url 完全匹配, 指定 handler
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
  [/^https?:\/\/tmdpic\.com\/index\.html\/?$/, 21],
  [/^https?:\/\/tmdpic\.com\/?$/, 21],
  [/^https?:\/\/xx\.knit\.bid\/?$/, 23],
  [/^https?:\/\/jablehk\.com\/?$/, 25],
  [/^https?:\/\/jablehk\.com\/hongkonggirls\d\/?$/, 25],
  [/^https?:\/\/jablehk\.com\/taiwangirls\d\/?$/, 25],
  [/^https?:\/\/jablehk\.com\/koreanjapangirls\d\/?$/, 25],
  [/^https?:\/\/jablehk\.com\/southeastasiangirls\d\/?$/, 25],
  [/^https?:\/\/jablehk\.com\/adult(-tw)?\/?$/, 25],
  [/^https?:\/\/asiantolick\.com\/?$/, 27],
  [/^https?:\/\/www\.mmm131\.com\/xinggan\/?$/, 29],
  [/^https?:\/\/www\.mmm131\.com\/qingchun\/?$/, 29],
  [/^https?:\/\/www\.mmm131\.com\/xiaohua\/?$/, 29],
  [/^https?:\/\/www\.mmm131\.com\/chemo\/?$/, 29],
  [/^https?:\/\/www\.mmm131\.com\/qipao\/?$/, 29],
  [/^https?:\/\/www\.mmm131\.com\/mingxing\/?$/, 29],
  [/^https?:\/\/www\.4kup\.net\/?$/, 31],
]
// 聚合网址搜索, 字符串替换关键字
const searchArr = [
  'https://everia.club/?s={##}',
  'https://www.24fa.com/search.aspx?keyword={##}&where=title',
  'https://junmeitu.com/search/{##}-1.html',
  // 'https://dongti233.com/?s={##}',
  'https://theasiagirl.com/?s={##}',
  'https://buondua.com/?search={##}',
  // 'https://tu.acgbox.org/index.php/search/{##}/',
  // 'https://xx.knit.bid/search/?s={##}',
  'https://asiantolick.com/search/{##}',
  'https://www.4kup.net/search?q={##}&max-results=18',
  'https://www.hentaicomic.ru/search/?q={##}&f=_all&s=create_time_DESC&syn=yes',
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

/**
 * 按类型, 提供支持的 handle_limit 的 handler 下标
 */
function filterSupStart(arr, img_or_tags = 'mix') {
  let mix
  mix = arr.filter(_ => supRaw_flat.some(s => _.startsWith(s)))
  mix.push(...arr.filter(_ => special_url.some(s => s[0].test(_))))
  let allowArr = []
  switch (img_or_tags) {
    case 'img':
      allowArr = [0, 2, 4, 6, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34]
      break
    case 'tags':
      allowArr = [1, 3, 5, 8, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33]
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

async function handleImgUrl(url) {
  let idx = getIndexByUrl(url)
  return handle_limit[idx][0].getImageArray(url)
}

async function handleTagUrl(url) {
  let idx = getIndexByUrl(url)
  return handle_limit[idx][0].getTagUrls(url)
}

function getLimitByUrl(url) {
  let idx = getIndexByUrl(url)
  return handle_limit[idx][1]
}

module.exports = {
  supportUrlArr: supRaw,
  searchArr,
  isSupport,
  filterSupStart,
  handleImgUrl,
  handleTagUrl,
  getLimitByUrl,
  getIndexByUrl,
  filter_deny_urls,
}
