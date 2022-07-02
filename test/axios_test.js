/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/27
 */
'use strict'
const axios = require('axios')
const config = {
  // baseURL: 'https://api.telegram.org/bot',
  // proxy: process.env.PROXY,
  proxy: undefined,
  timeout: 5000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36',
  },
  // httpsAgent: new https.Agent({
  //   rejectUnauthorized: false,
  // }),
}
console.log(process.env.PROXY)
axios.get('https://telegra.ph/%E6%B5%8B%E8%AF%95-03-28', config)
  .then(_ => _.data)
  .then(r => {
    console.log(r)
  })