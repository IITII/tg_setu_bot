/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'

const redis = require('../../libs/redis_client')
const {ADMIN_ID, check, taskName} = require('../../config/config')
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

async function admin_init() {
  const hall = await HGETALL()
  if (!hall && ADMIN_ID) {
    const arr = [
      'https://everia.club',
    ]
    for (const url of arr) {
      await redis_add_sub(url, ADMIN_ID)
    }
  }
}

async function redis_add_sub(url, uid, taskKey = taskName) {
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

async function redis_remove_sub(url, uid, taskKey = taskName) {
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

async function HSET(url, json, taskKey = taskName) {
  await redis_init()
  return await redis.HSET(taskKey, url, JSON.stringify(json))
}

async function HGETALL(taskKey = taskName) {
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

async function HSETALL(data, taskKey = taskName) {
  await redis_init()
  for (const k in data) {
    await redis.HSET(taskKey, k, JSON.stringify(data[k]))
  }
}

function get_random_next(breakTime) {
  const curr = Date.now()
  const negative = Math.random() < 0.5
  const random = Math.floor(Math.random() * breakTime * check.randomRate)
  return negative ? curr - random : curr + random
}

module.exports = {
  redis_add_sub,
  redis_remove_sub,
  admin_init,
  HSET,
  HGETALL,
  HSETALL,
  get_random_next,
}