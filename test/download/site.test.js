/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2023/02/09
 */
'use strict'

const sites = require('../../libs/download')

let site, url, siteTags

site = sites.kup
// siteTags = sites.kupTags


if (site) {
  url = 'https://www.4kup.net/2023/01/coserg44-vol076.html'
  site.getImageArray(url).then(console.log).catch(console.error)
}

if (siteTags) {
  url = 'https://www.4kup.net/search?q=Jeon%20Bo-Yeon%20(%EC%A0%84%EB%B3%B4%EC%97%B0)&max-results=18'
  siteTags.getTagUrls(url).then(console.log).catch(console.error)
  url = 'https://www.4kup.net/'
  siteTags.getTagUrls(url).then(console.log).catch(console.error)
}
