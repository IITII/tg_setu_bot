/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const fs = require('fs'),
  https = require('https'),
  path = require('path')
const config = {
  DEBUG: process.env.TG_DEBUG === 'true',
  BOT_TOKEN: process.env.BOT_TOKEN,
  // ADMIN_ID : process.env.ADMIN_ID,
  ADMIN_ID: process.env.ADMIN_ID,
  PROXY: process.env.PROXY,
  timeout: {
    sendMsg: 1000
  },
  telegram: {
    maxMediaGroupLength: 10, // 2-10
    maxMessageRate: 1, // 1
    maxMessageLength: 4096, // 4096
    docMaxSize: 50 * 1024 * 1024, // 50MB
  },
  axios: {
    // baseURL: 'https://api.telegram.org/bot',
    // proxy: process.env.PROXY,
    proxy: undefined,
    timeout: 1000 * 30,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.64 Safari/537.36',
    },
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
    }),
  },
  // support: mem, redis
  queueType: 'redis',
  redis: {
    url: process.env.REDIS_URL || 'redis://:review_pic@127.0.0.1:6379',
  },
  // 并发限制
  clip: {
    // 主网页抓取
    webLimit: 5,
    // eve 抓取 by tag
    tagLimit: 1,
    // 下载图片
    downloadLimit: 10,
    fa24Limit: 3,
    // 图片 header
    headLimit: 20,
    // 上/下一页
    pageLimit: 2,
    baseDir: '../tmp',
  },
}

// DO NOT TOUCH UNLESS YOU KNOW WHAT YOU ARE DOING
config.clip.baseDir = path.resolve(__dirname, config.clip.baseDir)
const proxy = process.env.PROXY?.replace(/https?:\/\//, '')
if (proxy) {
  config.axios.proxy = {
    host: proxy.split(':')[0],
    port: proxy.split(':')[1],
  }
}
const dir = config.clip.baseDir
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
  console.log(`mkdir ${dir}`)
}
module.exports = config