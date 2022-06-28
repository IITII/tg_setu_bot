/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'

const redis = require('../../libs/redis_client')
const {check} = require('../../config/config')
const {logger} = require('../../middlewares/logger')

async function redis_init() {
  const name = `redis_utils`
  if (redis.isOpen) {
    return redis
  } else {
    return await redis.connect()
      .then(_ => {
        logger.info(`${name} Connected`)
      })
      .then(_ => redis)
      .catch(err => {
        logger.error(`${name} Connect Error`, err)
      })
  }
}

async function add_sub(url, uid, taskKey) {
  await redis_init()
  const text = await redis.HGET(taskKey, url)
  let json = {uid: [], latest: [], nextTime: -1}
  if (text) {
    json = JSON.parse(text)
    if (!json.uid.includes(uid)) {
      json.uid.push(uid)
    }
  } else {
    json.uid.push(uid)
    json.nextTime = get_random_next()
  }
  await redis.HSET(taskKey, url, JSON.stringify(json))
}

async function remove_sub(url, uid, taskKey) {
  await redis_init()
  const text = await redis.HGET(taskKey, url)
  let json = {uid: [], latest: [], nextTime: -1}
  if (text) {
    json = JSON.parse(text)
    if (json.uid.includes(uid)) {
      json.uid = json.uid.filter(_ => _ !== uid)
      if (json.uid.length === 0) {
        await redis.HDEL(taskKey, url)
      } else {
        await redis.HSET(taskKey, url, JSON.stringify(json))
      }
    }
  }
}

async function HSET(taskKey, url, json) {
  await redis_init()
  return await redis.HSET(taskKey, url, JSON.stringify(json))
}

async function HGETALL(taskKey) {
  await redis_init()
  let res = {}
  const hMap = await redis.HGETALL(taskKey)
  if (hMap) {
    for (const k in hMap) {
      hMap[k] = JSON.parse(hMap[k])
    }
    res = hMap
  }
  return res
}

async function HSETALL(taskKey, data) {
  await redis_init()
  for (const k in data) {
    await redis.HSET(taskKey, k, JSON.stringify(data[k]))
  }
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
  HSET,
  HGETALL,
  HSETALL,
  get_random_next,
}