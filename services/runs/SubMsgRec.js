/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/28
 */
'use strict'

const {uniq} = require('lodash'),
  {message_decode} = require('../utils/service_utils'),
  {redis_add_sub, redis_remove_sub} = require('../tasks/redis_utils'),
  {filterSupStart} = require('./TaskRunner')

async function start_end_sub(ctx) {
  const sub = 'add'
  let s
  if (ctx.session && ctx.session.sub === sub) {
    s = await end_sub(ctx)
  } else {
    ctx.session = {sub}
    s = '输入链接以订阅, 重发命令以提交...'
  }
  return ctx.reply(s)
}

async function add_to_sub(ctx) {
  const message = ctx.message || ctx.update.message
  let urls = message_decode(message)
  urls = filterSupStart(urls)
  ctx.session.urls = urls.concat(ctx.session.urls || [])
}

async function end_sub(ctx) {
  const uid = ctx.message.from.id
  let urls = ctx.session.urls
  let s = `订阅 ${urls.length} 条链接`
  urls = uniq(urls)
  for (const url of urls) {
    await redis_add_sub(url, uid)
  }
  delete ctx.session.sub
  delete ctx.session.urls
  return s
}

async function remove_end_sub(ctx) {
  const sub = 'remove'
  let s
  if (ctx.session && ctx.session.sub === sub) {
    s = await remove_sub(ctx)
  } else {
    ctx.session = {sub}
    s = '输入链接以取消订阅, 重发命令以提交...'
  }
  return ctx.reply(s)
}

async function remove_sub(ctx) {
  const uid = ctx.message.from.id
  let urls = ctx.session.urls
  let s = `取消订阅 ${urls.length} 条链接`
  urls = uniq(urls)
  for (const url of urls) {
    await redis_remove_sub(url, uid)
  }
  delete ctx.session.sub
  delete ctx.session.urls
  return s
}

module.exports = {
  start_end_sub,
  add_to_sub,
  remove_end_sub,
  remove_sub,
}