'use strict';
const fetch = require('node-fetch'),
  cheerio = require('cheerio'),
  fs = require('fs'),
  path = require('path'),
  utils = require('./utils'),
  info = require('./info'),
  _ = require('lodash'),
  HttpsProxyAgent = require('https-proxy-agent'),
  PROXY = process.env.PROXY,
  PIXIV_USERNAME = process.env.PIXIV_USERNAME,
  PIXIV_PASSWORD = process.env.PIXIV_PASSWORD,
  PIXIV_TMP_FILE = process.env.PIXIV_TMP_FILE || '../tmp/pixiv.json',
  {logger} = require('../middlewares/logger'),
  mediaGroup_MAXSIZE = 10,
  webdriver = require('selenium-webdriver'),
  By = webdriver.By,
  BROWSER = 'chrome',
  chrome = require(`selenium-webdriver/${BROWSER}`),
  until = webdriver.until,
  SPLIT = '\n';
const commands = [
  'top',
  'taotu',
  'help'
]
const deal = [];
let taotu_FLAG = false;

/**
 * return dom base on url
 * @param url Telegraph URL
 * @return {Promise<*>} cheerio
 */
async function getDom(url) {
  let data = await (utils.isNil(PROXY) ? fetch(url) : fetch(url, {agent: new HttpsProxyAgent(PROXY)}));
  let text = await data.text();
  return await cheerio.load(text);
}

/**
 * sleep for a while
 * @param ms ms
 */
async function sleep(ms) {
  return await new Promise((resolve) => {
    setTimeout(() => {
      return resolve();
    }, ms)
  })
}

/**
 * Login to pixiv
 * @param driver selenium driver
 * @param username pixiv username
 * @param password pixiv password
 */
async function login(driver, username, password) {
  await driver.get('https://accounts.pixiv.net/login');
  await driver.wait(until.elementsLocated(By.id('LoginComponent')), 60000);
  let js = await fs.readFileSync(path.resolve(__dirname, '../libs/dom/login.js'), {
    encoding: 'utf-8'
  });
  js = js.replace('username', username)
    .replace('password', password);
  await driver.executeScript(`${js}`);
  await sleep(2000);
}

/**
 * Get Daily Rank Url
 * @param limit limit array size max: 50, default: 50
 * @return Array A array for Daily Rank Url with limit
 */
async function getDailyRankUrl(limit = 50) {
  return await new Promise(async (resolve, reject) => {
      try {
        if (limit <= 0 || limit > 50) {
          return reject('Limit should greater than 0 and less than 50');
        }
        const DAILY_RANKING_URL = 'https://www.pixiv.net/ranking.php?mode=daily&content=illust';
        let illustrationArray = [];
        let $ = await getDom(DAILY_RANKING_URL);
        await $('.work').each((index, item) => {
          // MAX ARRAY SIZE: 50
          if (index < limit) {
            illustrationArray.push(new URL(DAILY_RANKING_URL).origin + item.attribs.href);
          }
        })
        return resolve(illustrationArray);
      } catch (e) {
        return reject(e);
      }
    }
  )
}

/**
 * Get img origin url
 * @param driver selenium driver
 * @param imgUrl {URL}
 * @param js {String}
 * @return Array {Array} array length maybe greater than 1
 */
async function getRealImgUrl(driver, imgUrl, js) {
  return await new Promise(async resolve => {
    await driver.get(imgUrl);
    await driver.wait(until.elementLocated(By.css('div[role="presentation"] > a')), 600000)
    await driver.findElement(By.css('div[role="presentation"] > a')).click();
    await sleep(1000);
    let array = await driver.executeScript(`return ${js}`);
    return resolve(array);
  });
}

/**
 * Save or write data to file
 * @param filePath {String} file path
 * @param save {Boolean} true for save, false for read
 * @param data {String} when
 * @return {String} null for error, other for normal
 */
async function saveOrLoad(filePath, save, data = null) {
  return await new Promise(resolve => {
    if (!fs.existsSync(filePath)) {
      return resolve(null);
    }
    if (save) {
      if (data !== null) {
        try {
          fs.writeFileSync(filePath, data, {
            encoding: 'utf-8'
          });
          return resolve(true);
        } catch (e) {
          return resolve(null);
        }
      } else {
        return resolve(null);
      }
    } else {
      try {
        let data = fs.readFileSync(filePath, {
          encoding: 'utf-8'
        });
        return resolve(data);
      } catch (e) {
        return resolve(null);
      }
      
    }
  });
}

/**
 * pixiv daily ranking
 * @param ctx Telegraf content
 */
async function top(ctx) {
  await ctx.replyWithMarkdown(`在下了在下了...`);
  const date = require('moment')().format('YYYY-MM-DD');
  if (utils.isNil(PIXIV_USERNAME) || utils.isNil(PIXIV_PASSWORD)) {
    logger.error(`Empty ${PIXIV_USERNAME || 'PIXIV_USERNAME'} ${PIXIV_USERNAME || 'PIXIV_USERNAME'}`);
    return ctx.replyWithMarkdown(`**被玩坏了呢~~~**`)
  }
  
  if (fs.existsSync(PIXIV_TMP_FILE)) {
    logger.debug(`File is exist ${PIXIV_TMP_FILE}`);
    let data = await saveOrLoad(PIXIV_TMP_FILE, false);
    if (!utils.isNil(data)) {
      try {
        data = JSON.parse(data);
        if (date === data.date) {
          //reply with data.mediaGroup
          logger.debug(`Reply with tmp file's data.`);
          for (const e of utils.splitArray(data.links, SPLIT)) {
            await ctx.reply(e.join(SPLIT));
          }
          for (const subArray of _.chunk(data.mediaGroup, mediaGroup_MAXSIZE)) {
            await ctx.replyWithMediaGroup(subArray);
          }
          return;
        }
      } catch (e) {
        logger.error(e);
      }
    } else {
      logger.debug(`File is empty or with a error format!!!`);
    }
  }
  const driver = new webdriver.Builder()
    .forBrowser(BROWSER)
    .setChromeOptions(new chrome.Options()
      .addArguments(
        "--start-maximized",
        "--disable-notifications",
        "--disable-infobars",
        "--headless",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      )
    )
    .build();
  let rankUrls = await getDailyRankUrl();
  let mediaGroup = [];
  let js = await fs.readFileSync(path.resolve(__dirname, '../libs/dom/img.js'), {
    encoding: 'utf-8'
  });
  let tmpArray = [];
  await login(driver, PIXIV_USERNAME, PIXIV_PASSWORD);
  for (const rankUrl of rankUrls) {
    tmpArray = tmpArray.concat(await getRealImgUrl(driver, rankUrl, js));
  }
  tmpArray = _.uniq(tmpArray);
  for (let i = 0; i < tmpArray.length; i++) {
    let e = tmpArray[i];
    mediaGroup.push({
      media: e,
      caption: i,
      type: utils.mediaType(e)
    })
  }
  await driver.quit();
  logger.debug(`Reply and save to file: ${PIXIV_TMP_FILE}`);
  // save to file
  logger.debug(JSON.stringify(mediaGroup));
  await saveOrLoad(PIXIV_TMP_FILE, true, JSON.stringify({
    date,
    links: tmpArray,
    mediaGroup
  }));
  for (const e of utils.splitArray(tmpArray, SPLIT)) {
    await ctx.reply(e.join(SPLIT));
  }
  for (const subArray of _.chunk(mediaGroup, mediaGroup_MAXSIZE)) {
    await ctx.replyWithMediaGroup(subArray);
  }
}

async function taotu(ctx) {
  taotu_FLAG = taotu_FLAG || true;
  return ctx.replyWithMarkdown(`**我听着呢...**`)
}

/**
 * 套图处理
 * @param ctx Telegraf content
 */
async function taotuDeal(ctx) {
  if (taotu_FLAG) {
    taotu_FLAG = false;
    await ctx.replyWithMarkdown(`在下了在下了...`);
    let msg = ctx.update.message.text;
    msg = msg.split(/\s+/);
    // Remove duplicate links
    msg = _.uniq(msg);
    for (const url of msg) {
      if (utils.isNil(url)) {
        continue;
      }
      if (url.match('^https?:\\/\\/telegra\.ph\\/[\\s\\S]+') !== null) {
        let $ = await getDom(url);
        let mediaGroup = [], tmpArray = [], title = await $('header h1').text();
        let origin = new URL(url).origin
        await $("img").each((index, item) => {
          tmpArray.push(origin + item.attribs.src);
        });
        // Remove duplicate
        tmpArray = _.uniq(tmpArray);
        tmpArray.forEach(tmpUrl => {
          mediaGroup.push({
            media: origin + tmpUrl,
            caption: title,
            type: utils.mediaType(tmpUrl)
          });
        });
        await ctx.replyWithMarkdown(title);
        for (const e of utils.splitArray(tmpArray, SPLIT)) {
          await ctx.reply(e.join(SPLIT));
        }
        // mediaGroup 一次最大数量为 10
        for (const subArray of _.chunk(mediaGroup, mediaGroup_MAXSIZE)) {
          await ctx.replyWithMediaGroup(subArray);
        }
      } else {
        logger.warn(`Invalid URL: ${url}`);
        await ctx.replyWithMarkdown(`Invalid URL: ${url}`);
      }
    }
    return;
  }
  return info.errorInput(ctx);
}

deal.push({
  cmd: commands[0],
  func: top
});
deal.push({
  cmd: commands[1],
  func: taotu
});
deal.push({
  cmd: commands[2],
  func: info.help
})
module.exports = {
  deal,
  taotuDeal
};