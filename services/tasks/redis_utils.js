/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'

const redis = require('redis')

async function add_sub(url, uid, taskKey) {
  const arr = await redis.hget(taskKey, url)
  if (arr) {
    const arr_ = arr.split(',')
    if (!arr_.includes(uid)) {
      arr_.push(uid)
      await redis.hset(taskKey, url, arr_.join(','))
    }
  } else {
    await redis.hset(taskKey, url, uid)
  }
}

async function remove_sub(url, uid, taskKey) {
  const arr = await redis.hget(taskKey, url)
  if (arr) {
    let arr_ = arr.split(',')
    if (arr_.includes(uid)) {
      arr_ = arr_.filter(_ => _ !== uid)
      await redis.hset(taskKey, url, arr_.join(','))
    }
  }
}

async function get_all(taskKey) {
  return await redis.hgetall(taskKey)
}

module.exports = {
  add_sub,
  remove_sub,
  get_all,
}