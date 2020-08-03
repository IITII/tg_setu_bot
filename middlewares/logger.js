'use strict';
const fs = require('fs'),
  path = require('path'),
  APPEND_TO_FILE = process.env.APPEND_TO_FILE || false,
  LOG_NAME = process.env.LOG_NAME || 'tg_setu',
  LOG_LEVEL = process.env.LOG_LEVEL || 'debug',
  LOG_DIR = process.env.LOG_DIR || './logs/tg_setu.log',
  utils = require('../libs/utils');
let logDir = path.parse(LOG_DIR).dir;
if (!fs.existsSync(logDir)) {
  utils.mkdir(logDir, () => {
    console.log("Create un-exist path: " + logDir);
  });
}
const opts = {
  errorEventName: 'error',
  // logDirectory: LOG_DIR,
  // fileNamePattern: 'Tg_setu_<DATE>.log',
  logFilePath: APPEND_TO_FILE ? LOG_DIR : null,
  dateFormat: 'YYYY.MM.DD',
  timestampFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
  level: LOG_LEVEL,
  category: LOG_NAME
};
/**
 * Logger Level: trace, debug, info, warn, error and fatal levels
 */
const logger = require('simple-node-logger').createSimpleLogger(opts);
/**
 * Telegram bot logger middleware
 */
const loggerMiddleware = async (ctx, next) => {
  const start = new Date();
  return next()
    .then(() => {
      let log = {
        cost: new Date() - start,
        updateType: ctx.updateType,
        username: `@${ctx.update.message.from.username}`,
        name: `${ctx.update.message.from.first_name} ${ctx.update.message.from.last_name}`,
        id: ctx.update.message.from.id,
        chatType: ctx.update.message.chat.type,
        updateSubTypes: ctx.updateSubTypes,
        content: ctx.update.message.text || 'Not a text message. See `updateType` & `updateSubTypes`'
      }
      logger.info(JSON.stringify(log));
    });
}

module.exports = {
  logger,
  loggerMiddleware
};