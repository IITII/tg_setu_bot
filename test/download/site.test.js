/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2023/02/09
 */
'use strict'

const sites = require('../../libs/download')

let site, url, siteTags

site = sites.eveira
// siteTags = sites.eveiraTags


if (site) {
  url = 'https://everia.club/2023/02/08/karen-yuzuriha-%e6%a5%aa%e3%82%ab%e3%83%ac%e3%83%b3-graphis-gals-%e3%80%8cunveil%e3%80%8d-vol-03/'
  site.getImageArray(url).then(console.log).catch(console.error)
}

if (siteTags) {
 // url =
  siteTags.getTagUrls(url).then(console.log).catch(console.error)
}
