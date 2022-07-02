/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/29
 */
'use strict'
const {ADMIN_ID, db, clip} = require('./config/config')
const {Markup} = require('telegraf'),
  {uniq} = require('lodash'),
  LocalSession = require('telegraf-session-local'),
  localSession = new LocalSession(db)
const {loggerMiddleware} = require('./middlewares/logger'),
  {clean} = require('./services/utils/msg_utils'),
  {filterTagsOnly} = require('./services/runs/TaskRunner'),
  picMsgRec = require('./services/runs/PicMsgRec'),
  {redis_add_sub, redis_remove_sub} = require('./services/tasks/redis_utils')
const default_session = {
  // init, pic, sub
  curr: 'init',
  pic: {
    // init, download, copy
    mode: 'init',
  },
  sub: {
    // add, remove
    mode: 'init',
    urls: [],
  },
  opts: {
    // img, tags, mix
    img_or_tags: 'img',
  },
}
const img_or_tags_arr = [
  ['只要图', 'img'],
  ['只要Tag', 'tags'],
  ['我全都要', 'mix'],
]

const commands = [
  ['/start', hello,],
  ['/unset', unset,],
  ['/clean', cleanTmp,],
  ['/copy_del', copy,],
  ['/download', download,],
  ['/sub', start_end_sub,],
  ['/u_sub', start_end_sub,],
]
const actions = [
  ...img_or_tags_arr.map(([_, ac]) => [ac, action_img_or_tags]),
]

function init_session(ctx) {
  let {curr, pic, sub, opts} = ctx.session || default_session
  ctx.session = {
    curr: curr || default_session.curr,
    pic: {
      ...default_session.pic,
      ...pic,
    },
    sub: {
      ...default_session.sub,
      ...sub,
    },
    opts: {
      ...default_session.opts,
      ...opts,
    },
  }
  return ctx
}

function pic_init(ctx) {
  ctx = init_session(ctx)
  ctx.session.curr = 'pic'
  return ctx
}

function sub_init(ctx) {
  ctx = init_session(ctx)
  ctx.session.curr = 'sub'
  return ctx
}

// basic commands
async function hello(ctx) {
  const {from} = ctx.update.message,
    {first_name, last_name} = from,
    name = `${first_name || ''}${last_name || ''}`
  return ctx.reply(`Hello ${name}`)
}

async function unset(ctx) {
  ctx.session = undefined
  return ctx.reply('Set cleaned')
}

// pic commands
async function cleanTmp(ctx) {
  const uid = ctx.from.id
  if (uid === ADMIN_ID) {
    return clean(ctx.chat.id, clip.baseDir)
  } else {
    return ctx.reply('你又不是狗管理')
  }
}

async function copy(ctx) {
  ctx = pic_init(ctx)
  ctx.session.pic = {mode: 'copy'}
  return img_or_tags(ctx, '看看看')
}

async function download(ctx) {
  ctx = pic_init(ctx)
  ctx.session.pic = {mode: 'download'}
  return img_or_tags(ctx, '下下下')
}

// share actions
async function img_or_tags(ctx, msg) {
  return ctx.reply(msg, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      ...img_or_tags_arr.map(([hint, t]) => {
        return Markup.button.callback(hint, t)
      })
    ])
  })
}

async function action_img_or_tags(ctx) {
  ctx.session.opts.img_or_tags = ctx.match[0]
  const [text, _] = img_or_tags_arr.find(([_, ac]) => ac === ctx.match[0])
  return ctx.answerCbQuery(`${text || '我要什么来着???'}!!!`)
}

// sub commands
async function start_end_sub(ctx) {
  ctx = sub_init(ctx)
  const message = ctx.message || ctx.update.message
  const commands = message.entities.filter(_ => _.type === 'bot_command')
      .map(({offset, length}) => message.text.substring(offset, offset + length)),
    command = commands[0],
    mode = command === '/sub' ? 'add' : 'remove',
    remove_hint = mode === '/sub' ? '' : '取消'
  let msg
  if (ctx.session.sub.mode === mode) {
    msg = await end_sub(ctx)
  } else {
    ctx.session.sub = {mode, urls: []}
    msg = `输入链接以${remove_hint}订阅, 重发命令以提交...`
  }
  return ctx.reply(msg)
}

async function end_sub(ctx) {
  ctx = sub_init(ctx)
  const isSub = ctx.session.sub.mode === 'add'
  const uid = ctx.message.from.id
  let urls = ctx.session.sub.urls
  let s = `${isSub ? '' : '取消'}订阅 ${urls.length} 条链接`
  urls = uniq(urls)
  for (const url of urls) {
    const redis_handle = isSub ? redis_add_sub : redis_remove_sub
    await redis_handle(url, uid)
  }
  ctx.session.sub = default_session.sub
  return s
}

async function add_to_sub(ctx) {
  ctx = sub_init(ctx)
  const message = ctx.message || ctx.update.message
  let urls = filterTagsOnly(message)
  ctx.session.sub.urls = [...ctx.session.sub.urls, ...urls]
}


// message forwarding
// const map = new Map()
async function message_forward(ctx) {
  ctx = init_session(ctx)
  // const uid = ctx.from.id
  switch (ctx.session.curr) {
    case 'pic':
      await picMsgRec(ctx)
      break
    case 'sub':
      await add_to_sub(ctx)
      break
    case 'init':
    case 'opts':
    default:
      // let timer = map.get(uid)
      // if (timer) {
      //   clearTimeout(timer)
      // }
      // timer = setTimeout(() => {
      //   map.delete(uid)
      //   ctx.reply('不要玩了')
      // }, 1000)
      return ctx.reply('不要玩了')
  }
}

module.exports = async bot => {
  bot.use(localSession.middleware())
  bot.use(loggerMiddleware)
  commands.forEach(([cmd, handler]) => {
    bot.command(cmd, handler)
  })
  actions.forEach(([action, handler]) => {
    bot.action(action, handler)
  })
  bot.on('message', message_forward)
}