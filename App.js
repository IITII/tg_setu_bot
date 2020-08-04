'use strict';
const Telegraf = require('telegraf'),
  HttpsProxyAgent = require('https-proxy-agent'),
  session = require('telegraf/session'),
  utils = require('./libs/utils'),
  {logger, loggerMiddleware} = require('./middlewares/logger'),
  commandsWithDeal = require('./libs/command'),
  info = require('./libs/info'),
  BOT_TOKEN = process.env.BOT_TOKEN,
  PROXY = process.env.PROXY;

/**
 * Check variable before start
 */
function preStart() {
  if (utils.isNil(process.env.BOT_TOKEN)) {
    logger.error(`Empty BOT_TOKEN`);
    process.exit(1);
  }
}

async function main() {
  const bot = (() => {
    // Using system proxy. For example: http://127.0.0.1:10809
    if (utils.isNil(PROXY)) {
      return new Telegraf(BOT_TOKEN);
    } else {
      const agent = new HttpsProxyAgent(PROXY);
      return new Telegraf(BOT_TOKEN, {
        telegram: {agent}
      });
    }
  })();
  // logger
  bot.use(loggerMiddleware);
  // Register session middleware
  bot.use(session())
  bot.start((ctx) => {
    return ctx.reply(`Hello ${ctx.update.message.from.first_name} ${ctx.update.message.from.last_name}`);
  });
  bot.help(ctx => {
    return info.help(ctx);
  });
  commandsWithDeal.deal.forEach(deal => {
    bot.command(deal.cmd, deal.func);
  });
  bot.on('sticker', ctx => {
    return ctx.replyWithSticker(ctx.update.message.sticker.file_id);
  });
  bot.on('photo', ctx => {
    return info.noNSFW(ctx);
  });
  bot.on('text', ctx => {
    return commandsWithDeal.taotuDeal(ctx);
  });
  bot.on('message', ctx => {
    return info.errorInput(ctx);
  });
  bot.launch()
    .then(() => {
      logger.info(`Bot Started...`);
    })
    .catch(e => {
      logger.fatal(e);
    });
}

preStart();
main()
  .catch(e => {
    logger.error(e);
  })