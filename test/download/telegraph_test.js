/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/27
 */
'use strict'
const getImageArray = require('../../libs/download/Telegraph')

getImageArray('https://telegra.ph/%E6%B5%8B%E8%AF%95-03-28')
  .then(_ => console.log(_))
