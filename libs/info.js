'use strict';
let baseMsg = "1. `/top`: 显示 `pixiv` 日榜\n2. `/setu <url>`: 给我一个 Telegraph 链接，还你一片图";

function help(ctx) {
  ctx.replyWithMarkdown(baseMsg);
}

function errorInput(ctx) {
  ctx.replyWithMarkdown("输入错误!!!\n" + baseMsg);
}

module.exports = {
  help,
  errorInput
}