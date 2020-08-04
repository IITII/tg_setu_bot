'use strict';
const fetch = require('node-fetch'),
  cheerio = require('cheerio'),
  utils = require('./utils'),
  info = require('./info'),
  _ = require('lodash'),
  HttpsProxyAgent = require('https-proxy-agent'),
  PROXY = process.env.PROXY,
  {logger} = require('../middlewares/logger'),
  mediaGroup_MAXSIZE = 10;
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
 *
 * @param ctx Telegraf content
 */
function top(ctx) {
  return ctx.replyWithMarkdown(`_top_`);
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
        let mediaGroup = [], title = await $('header h1').text();
        await $("img").each((index, item) => {
          mediaGroup.push({
            media: new URL(url).origin + item.attribs.src,
            caption: title,
            type: 'photo'
          });
        });
        // Remove duplicate
        mediaGroup = _.uniqBy(mediaGroup, 'media');
        await ctx.replyWithMarkdown(title);
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