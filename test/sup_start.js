/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/07/03
 */
'use strict'


const {filterSupStart} = require('../services/utils/support_urls_utils')
let res = filterSupStart([
  'https://junmeitu.com/model/yangchenchen.html'
], 'mix')
console.log(res)