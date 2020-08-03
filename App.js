'use strict';
const Telegraf = require('telegraf'),
  HttpsProxyAgent = require('https-proxy-agent'),
  {logger, loggerMiddleware} = require('./middlewares/logger'),
  commandsWithDeal = require('./libs/command'),
  info = require('./libs/info'),
  BOT_TOKEN = process.env.BOT_TOKEN,
  PROXY = process.env.PROXY;

/**
 * Checks if value is null or undefined or ''.
 * @param object object
 * @return {boolean} true for nil or ''
 */
function isNil(object) {
  return (object == null) || (object === '');
}

/**
 * Check variable before start
 */
function preStart() {
  if (isNil(process.env.BOT_TOKEN)) {
    logger.error(`Empty BOT_TOKEN`);
    process.exit(1);
  }
}

async function main() {
  const bot = (() => {
    // Using system proxy. For example: http://127.0.0.1:10809
    if (isNil(PROXY)) {
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
  bot.start((ctx) => ctx.reply('Hello'))
  commandsWithDeal.forEach(deal => {
    bot.command(deal.cmd, deal.func);
  })
  bot.on('text', ctx => {
    info.help(ctx);
  })
  bot.on('message', ctx => {
    info.errorInput(ctx);
  });
  bot.launch()
    .then(() => {
      logger.info(`Server Started...`);
    })
    .catch(e => {
      logger.error(e);
    });
}

preStart();
main()
  .catch(e => {
    logger.error(e);
  })