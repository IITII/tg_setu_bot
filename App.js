const {Telegraf} = require('telegraf')
process.env.BOT_TOKEN = '1286442836:AAGkWV6wy4tBwCiGCC3K6BODeuqHmqd8AFo';
process.env.NTBA_FIX_319 = 1;
// BOT_TOKEN = '1286442836:AAGfewMokRQ-ymy8U8nErxaNmVc-YWquIpw';
const bot = new Telegraf(process.env.BOT_TOKEN)

// const bot = new Telegraf(BOT_TOKEN)
bot.start((ctx) => ctx.reply('Welcome!'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply('👍'))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.on('polling_error', (error) => {
  var time = new Date();
  console.log("TIME:", time);
  console.log("CODE:", error.code);  // => 'EFATAL'
  console.log("MSG:", error.message);
  console.log("STACK:", error.stack);
});
bot.on('uncaughtException', (error) => {
  var time = new Date();
  console.log("TIME:", time);
  console.log("NODE_CODE:", error.code);
  console.log("MSG:", error.message);
  console.log("STACK:", error.stack);
});
bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
})
bot.launch()
  .catch(e => {
    console.error(e)
  })