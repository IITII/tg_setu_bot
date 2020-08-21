'use strict';
const fetch = require('node-fetch'),
    cheerio = require('cheerio'),
    fs = require('fs'),
    path = require('path'),
    utils = require('./utils'),
    info = require('./info'),
    _ = require('lodash'),
    HttpsProxyAgent = require('https-proxy-agent'),
    {saveImg, SAVE_DIR, getDate} = require('./pixivDownload'),
    PROXY = process.env.PROXY,
    PIXIV_USERNAME = process.env.PIXIV_USERNAME,
    PIXIV_PASSWORD = process.env.PIXIV_PASSWORD,
    PIXIV_TMP_FILE = path.resolve(__dirname, process.env.PIXIV_TMP_FILE || '../tmp/pixiv.json'),
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
  'help',
  'echo'
]
const deal = [];
let flag = {
  taotu_flag: false,
  top_flag: false,
  echo: false
};

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
      if (!fs.existsSync(filePath)) {
        return resolve(null);
      }
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
  const date = require('moment')().format('YYYY-MM-DD');
  if (flag.top_flag) {
    return ctx.replyWithMarkdown(`_早就在下了_，*不要急哈~*`)
  }
  flag.top_flag = true;
  await ctx.replyWithMarkdown(`稍等稍等，我先找找啊~`);
  if (fs.existsSync(PIXIV_TMP_FILE)) {
    await ctx.replyWithMarkdown(`哇塞，找到了~`);
    try {
      let data = await saveOrLoad(PIXIV_TMP_FILE, false);
      if (!utils.isNil(data)) {
        try {
          data = JSON.parse(data);
          if (date === data.date) {
            logger.debug(`Reply with tmp file's data.`);
            let links = (function () {
              let tmp = [];
              data.mediaGroup.forEach(e => {
                tmp.push(e.media);
              });
              return tmp;
            })();
            for (const e of utils.splitArray(links, SPLIT)) {
              await ctx.reply(e.join(SPLIT));
            }
            return;
          }
        } catch (e) {
          await ctx.replyWithMarkdown(`哇塞，文件有问题，**问题很大~**`);
          logger.error(e);
        }
      } else {
        await ctx.replyWithMarkdown(`**咦~~**，文件居然是空的...`);
        await ctx.replyWithMarkdown(`**不要慌**，_小场面_，问题不大~`);
        logger.debug(`File is empty or with a error format!!!`);
      }
    } catch (e) {
      logger.error(e);
      return ctx.replyWithMarkdown(`凉了凉了，溜了`);
    } finally {
      flag.top_flag = false;
    }
  }
  // Telegram sendPhoto() MAX_SIZE of photo is 5 MB, So just sending the url
  await ctx.replyWithMarkdown(`在下了在下了...`);
  
  if (utils.isNil(PIXIV_USERNAME) || utils.isNil(PIXIV_PASSWORD)) {
    logger.error(`Empty ${PIXIV_USERNAME || 'PIXIV_USERNAME'} ${PIXIV_USERNAME || 'PIXIV_USERNAME'}`);
    flag.top_flag = false;
    return ctx.replyWithMarkdown(`**被玩坏了呢~~~**`)
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
  let js = await fs.readFileSync(path.resolve(__dirname, '../libs/dom/img.js'), {
    encoding: 'utf-8'
  });
  let data = {
    date,
    useragent: "",
    links: [],
    mediaGroup: [],
  };
  await login(driver, PIXIV_USERNAME, PIXIV_PASSWORD);
  data.useragent = await driver.executeScript(`return navigator.userAgent`);
  let count = 0;
  let IMG_TMP_DIR = SAVE_DIR + path.sep + getDate();
  for (const rankUrl of rankUrls) {
    let tmp = await getRealImgUrl(driver, rankUrl, js);
    tmp.forEach(e => {
      count++;
      data.links.push({
        url: e,
        origin: rankUrl,
        savePath: IMG_TMP_DIR + path.sep + count + path.extname(e)
      });
      data.mediaGroup.push({
        media: e,
        caption: `${date}-${count}`,
        type: utils.mediaType(e)
      });
    })
  }
  await driver.quit();
  data.links = _.uniqBy(data.links, 'url');
  data.mediaGroup = _.uniqBy(data.mediaGroup, 'media');
  
  logger.debug(`Reply and saving to file: ${PIXIV_TMP_FILE}`);
  // save to file
  saveOrLoad(PIXIV_TMP_FILE, true, JSON.stringify(data))
    .then(() => {
      logger.debug(`Saved to file: ${PIXIV_TMP_FILE}`)
    })
    .catch(e => {
      logger.error(`Unable to save data to file: ${PIXIV_TMP_FILE}`);
      logger.error(e);
    });
  let links = (function () {
    let tmp = [];
    data.mediaGroup.forEach(e => {
      tmp.push(e.media);
    });
    return tmp;
  })();
  for (const e of utils.splitArray(links, SPLIT)) {
    await ctx.reply(e.join(SPLIT));
  }
  // PIXIV image files usually large than 5M...
  // for (const subArray of _.chunk(mediaGroup, mediaGroup_MAXSIZE)) {
  //   await ctx.replyWithMediaGroup(subArray);
  // }
  await saveImg(data)
  flag.top_flag = false;
  // remove files after zipped files
  // utils.rm_rf(IMG_TMP_DIR);
}

async function taotu(ctx) {
  flag.taotu_flag = flipFlag(flag.taotu_flag);
  return ctx.replyWithMarkdown(`**我听着呢...**`)
}

/**
 * 套图处理
 * @param ctx Telegraf content
 */
async function taotuDeal(ctx) {
  if (flag.echo) {
    return ctx.telegram.sendCopy(ctx.chat.id, ctx.message);
  }
  if (flag.taotu_flag) {
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
        for (let i = 0; i < tmpArray.length; i++) {
          let tmpUrl = tmpArray[i];
          mediaGroup.push({
            media: tmpUrl,
            caption: `${title}-${i + 1}`,
            type: utils.mediaType(tmpUrl)
          });
        }
        await ctx.replyWithMarkdown(title);
        // for (const e of utils.splitArray(tmpArray, SPLIT)) {
        //   await ctx.reply(e.join(SPLIT));
        // }
        // mediaGroup 一次最大数量为 10
        for (const subArray of _.chunk(mediaGroup, mediaGroup_MAXSIZE)) {
          await ctx.replyWithMediaGroup(subArray);
        }
      } else {
        logger.warn(`Invalid URL: ${url}`);
        await ctx.replyWithMarkdown(`Invalid URL: ${url}`);
      }
    }
    flag.taotu_flag = false;
  }
  return info.errorInput(ctx);
}

function echo(ctx) {
  flag.echo = flipFlag(flag.echo);
  return ctx.replyWithMarkdown(flag.echo ? `复读姬ing...` : `复读，完了...`);
}

/**
 * Flip flag
 * @param inputFlag {Boolean}
 * @return {*|boolean} !inputFlag
 */
function flipFlag(inputFlag) {
  let tmp = inputFlag;
  // Prevent duplicate request
  for (let subFlag in flag) {
    flag[subFlag] = false;
  }
  return !tmp;
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
});
deal.push({
  cmd: commands[3],
  func: echo
});
module.exports = {
  deal,
  taotuDeal
};