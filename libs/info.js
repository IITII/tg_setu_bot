'use strict';
const baseMsg = "1. `/top`: 显示 `pixiv` 日榜\n2. `/setu <url>`: 给我一个 Telegraph 链接，还你一片图";

/**
 * 查看帮助
 */
function help(ctx) {
  return ctx.replyWithMarkdown(baseMsg);
}

/**
 * 错误输入
 */
function errorInput(ctx) {
  return ctx.replyWithMarkdown("输入错误!!!\n" + baseMsg);
}

function noNSFW(ctx) {
  ctx.session.noNSFW = ctx.session.noNSFW || 0;
  ctx.session.noNSFW++;
  let base = "我不要涩图，赶紧滚...";
  let returnMsg = ctx.session.noNSFW > 4
    ? "啊!~\n都说几遍了???\n" + base
    : ctx.session.noNSFW > 1
      ? "我再说一遍, 我不是在开玩笑!!!\n" + base
      : base;
  let mediaGroup = [];
  ctx.update.message.photo.forEach(item => {
    mediaGroup.push({
      media: item.file_id,
      caption: returnMsg,
      type: 'photo'
    });
  });
  return ctx.replyWithMediaGroup(mediaGroup);
}

module.exports = {
  help,
  errorInput,
  noNSFW
}