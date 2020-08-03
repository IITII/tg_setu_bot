'use strict';
const commands = [
  'top',
  'taotu'
]
const deal = [];

/**
 *
 * @param ctx Telegraf content
 */
function top(ctx) {

}

/**
 *
 * @param ctx Telegraf content
 */
function taotu(ctx) {

}

deal.push({
  cmd: commands[0],
  func: top
});
deal.push({
  cmd: commands[1],
  func: taotu
});
module.exports = deal;