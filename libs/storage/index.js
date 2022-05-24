/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/03
 */
'use strict'
const {queueType} = require('../../config/config.js')
const RedisStorage = require('./redis_storage')
const MemStorage = require('./mem_storage')

let storage

switch (queueType) {
  case 'redis':
    storage = RedisStorage
    break
  case 'mem':
  default:
    storage = MemStorage
    break
}

module.exports = storage