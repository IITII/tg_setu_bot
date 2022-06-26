/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'

const redis = require('redis')
const {check} = require('../../config/config')

async function add_sub(url, uid, taskKey) {
  const text = await redis.hget(taskKey, url)
  let json = {uid: [], latest: '', nextTime: -1}
  if (text) {
    json = JSON.parse(text)
    if (!json.uid.includes(uid)) {
      json.uid.push(uid)
    }
  } else {
    json.uid.push(uid)
    json.nextTime = get_random_next()
  }
  await redis.hset(taskKey, url, JSON.stringify(json))
}

async function remove_sub(url, uid, taskKey) {
  const text = await redis.hget(taskKey, url)
  let json = {uid: [], latest: '', nextTime: -1}
  if (text) {
    json = JSON.parse(text)
    if (json.uid.includes(uid)) {
      json.uid = json.uid.filter(_ => _ !== uid)
      if (json.uid.length === 0) {
        await redis.hdel(taskKey, url)
      } else {
        await redis.hset(taskKey, url, JSON.stringify(json))
      }
    }
  }
}

async function get_all(taskKey) {
  return await redis.hgetall(taskKey)
}

function get_random_next(curr) {
  curr = curr || Date.now()
  const negative = Math.random() < 0.5
  const random = Math.floor(Math.random() * check.all * check.randomRate)
  return negative ? curr - random : curr + random
}

module.exports = {
  add_sub,
  remove_sub,
  get_all,
  get_random_next,
}