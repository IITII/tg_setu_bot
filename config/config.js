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
  // 添加不同的token后，务必先访问 bot，否则消息不会发送
  tokens: {
    // 订阅专用 token
    subscribe: process.env.SUBSCRIBE_TOKEN,
    // 图片专用 token, 支持多个token
    picWorkers: process.env.WORKERS_TOKEN?.split(',') || [],
  },
  ids: {
    // 管理员 uid
    adminId: process.env.ADMIN_ID,
    forwardId: process.env.FORWARD_ID,
  },
  PROXY: process.env.PROXY,
  db: {
    database: process.env.DB_FILE || '../db/db.json',
  },
  timeout: {
    sendMsg: 1000,
    checkWorker: 1000,
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
  queueName: {
    pic_add: 'bot_pic_queue',
    msg_send: 'bot_msg_queue',
    action_worker: 'bot_worker_action_queue',
  },
  eventName: {
    pic_add: 'pic_add',
    msg_send: 'msg_send',
    action_worker: 'bot_worker_action',
  },
  check: {
    // 随机时长比例
    randomRate: 0.20,
    // 默认任务检查时间间隔, 6h
    all: 1000 * 60 * 60 * 6,
    // 5 分钟检查一次 redis
    period: 1000 * 60 * 5,
  },
  taskName: 'bot_schedule_task',
  taskLimit: {
    // 最近URL条数
    latest: 3,
    // 第一次运行时最多发送条数
    firstMax: 20,
    // 订阅已发送链接过期时间, 12month
    sub_expire: 60 * 60 * 24 * 30 * 12,
    // 订阅已发送链接
    sub_prefix: {
      url: 'bot_sent_sub_url_',
      text: 'bot_sent_sub_text_',
    },
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://:review_pic@127.0.0.1:6379',
  },
  // 并发限制
  clip: {
    // 主网页抓取
    webLimit: 5,
    // eve 抓取 by tag
    eveTagLimit: 1,
    faTagLimit: 1,
    // 下载图片
    telegrafLimit: 10,
    // eve
    eveLimit: 12,
    // fa24
    fa24Limit: 3,
    // junMei
    junMeiLimit: 3,
    junMeiTagLimit: 1,
    // bus
    busTagLimit: 1,
    // dongTi
    dongTiLimit: 1,
    dongTiTagLimit: 1,
    // asiaG
    asiaGLimit: 1,
    asiaGTagsLimit: 1,
    // dua
    duaLimit: 1,
    duaTagsLimit: 1,
    // 图片 header
    headLimit: 20,
    // 上/下一页
    pageLimit: 1,
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
mkdir(config.clip.baseDir)
if (!config.db.database) {
  config.db.database = '../db/db.json'
}
config.db.database = path.resolve(__dirname, config.db.database)
mkdir(path.dirname(config.db.database))

function mkdir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`mkdir ${dir}`)
  }
}

module.exports = config