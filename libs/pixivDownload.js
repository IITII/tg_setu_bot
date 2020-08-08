'use strict';
const fetch = require('node-fetch'),
  path = require('path'),
  async = require('async'),
  HttpsProxyAgent = require('https-proxy-agent'),
  util = require('util'),
  fs = require('fs'),
  streamPipeline = util.promisify(require('stream').pipeline),
  utils = require('./utils'),
  date = require('moment')().format('YYYY-MM-DD'),
  PROXY = process.env.PROXY,
  SAVE_DIR = process.env.SAVE_DIR || path.resolve(__dirname, '../tmp/'),
  IMG_TMP_DIR = SAVE_DIR + path.sep + date,
  {logger} = require('../middlewares/logger'),
  LIMIT = process.env.LIMIT || 10;
let User_Agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36';

async function fetchImg(url, referer = null, user_agent = null) {
  return await new Promise(async (resolve, reject) => {
    try {
      if (utils.isNil(PROXY)) {
        let data = await fetch(url, {
          headers: {
            "Referer": referer,
            "User-Agent": user_agent || User_Agent
          },
          compress: true
        });
        if (data.ok) {
          return resolve(data);
        } else {
          return reject(data);
        }
      } else {
        let data = await fetch(url, {
          agent: new HttpsProxyAgent(PROXY),
          headers: {
            "Referer": referer,
            "User-Agent": user_agent || User_Agent
          },
          compress: true
        });
        if (data.ok) {
          return resolve(data);
        } else {
          return reject(data);
        }
      }
    } catch (e) {
      return reject(e);
    }
  })
}

async function downImg(imgSrc, callback) {
  logger.info(`Downloading ${imgSrc.url}...`);
  await utils.spendTime(async () => {
    let data = await fetchImg(imgSrc.url, imgSrc.origin, imgSrc.user_agent || User_Agent);
    if (data.ok) {
      await streamPipeline(data.body, fs.createWriteStream(imgSrc.savePath));
    }
  })
    .then(() => {
      logger.info(`Save to ${imgSrc.savePath}`);
    })
    .catch(e => {
      logger.error(`Download error!!!`);
      logger.error(e);
    })
    .finally(callback);
}

async function saveImg(data) {
  User_Agent = data.useragent;
  utils.mkdir(IMG_TMP_DIR, () => {
    logger.info(`Create un-exist path: ${IMG_TMP_DIR}`);
    // LIMIT: Concurrency download limit
    async.mapLimit(data.links, LIMIT, async function (link, callback) {
      await downImg(link, callback);
    })
      .then(() => {
        logger.info(`Download completed!!! Downloaded  to ${IMG_TMP_DIR}`);
      })
      .then(() => {
        logger.info(`Compressing files...`);
        let zipPath = path.resolve(SAVE_DIR, date + '.zip');
        utils.zipDir(IMG_TMP_DIR, zipPath)
          .then(() => {
            logger.info(`Compress completed!!! Save to ${zipPath}`);
          })
          .catch(e => {
            logger.error(`Compress failed!!!`);
            logger.error(e);
          })
      })
      .catch(e => {
        logger.error(`Unknown error!!!`);
        logger.error(e);
      })
  });
}

module.exports = {
  saveImg,
  IMG_TMP_DIR
}