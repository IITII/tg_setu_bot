/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/01
 */
'use strict'
const Storage = require('./storage')
const {logger} = require('../../middlewares/logger')
const redis = require('../../libs/redis_client')

class RedisStorage extends Storage {

  constructor(queueKey = 'review_queue') {
    super()
    this.queueKey = queueKey
    this.client = redis.duplicate()
  }

  async checkConn() {
    if (this.client.isOpen) {
      return this.client
    } else {
      const name = `${this.name} -> ${this.queueKey}`
      await this.client.connect()
        .then(_ => {
          logger.info(`${name} Connected`)
        })
        .then(_ => this.client)
        .catch(err => {
          logger.error(`${name} Connect Error`, err)
        })
    }
  }

  async rpush(v) {
    await this.checkConn()
    return this.client.rPush(this.queueKey, JSON.stringify(v))
  }

  async lpop() {
    await this.checkConn()
    return this.client.lPop(this.queueKey)
      .then(v => {
        if (v) {
          return JSON.parse(v)
        } else {
          return v
        }
      })
  }

  async llen() {
    await this.checkConn()
    return this.client.lLen(this.queueKey)
  }

  async clear() {
    await this.checkConn()
    return this.client.del(this.queueKey)
  }

  async close() {
    if (this.client.isOpen) {
      await this.client.quit()
    }
  }
}

module.exports = RedisStorage