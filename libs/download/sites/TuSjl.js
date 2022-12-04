/**
 * @deprecated 图片数量不对
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/26
 */
'use strict'

const {getImgArr, arrToAbsUrl} = require('../dl_utils')
const {titleFormat} = require('../../utils')

async function getImageArray(url) {
 return getImgArr(url, handle_dom)
}

async function handle_dom($, original) {
 let title, imgs, otherPages, related, tags, denyPages, urls
 denyPages = '«,»'.split(',')

 title = $($('.post-info .post-info-text').get(0)).text()
 imgs = $('#masonry img').map((i, el) => el.attribs['data-original']).get()

 title = titleFormat(title)
 imgs = arrToAbsUrl(imgs, original)

 const res = {title, imgs, tags}
 return Promise.resolve(res)
}


let url
url = 'http://tu.sjldbz.com/index.php/archives/82/'
getImageArray(url).then(console.log)

module.exports = {
 getImageArray,
}
