/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2023/02/09
 */
'use strict'

const sites = require('../../libs/download')

let site, url, siteTags

// site = sites.kup
siteTags = sites.asiaGTags


if (site) {
  url = 'https://www.4kup.net/2023/01/coserg44-vol076.html'
  site.getImageArray(url).then(console.log).catch(console.error)
}

if (siteTags) {
  url = 'https://theasiagirl.com/tag/sia_s22/'
  siteTags.getTagUrls(url).then(console.log).catch(console.error)
}
