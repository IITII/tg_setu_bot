/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/02
 */
'use strict'

const { downloadFile } = require('../../libs/utils')
const fs = require('fs')
let url, save, referer
url = ''
save = '/tmp/test.jpg'
referer = 'https://www.mrcong.com/'
referer = ''

if (fs.existsSync(save)) {
  fs.unlinkSync(save)
}

downloadFile(url, save, referer)
  .then(console.log).catch(console.error)