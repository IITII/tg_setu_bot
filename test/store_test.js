/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/03
 */
'use strict'

const MemStorage = require('../libs/storage/mem_storage')
const RedisStorage = require('../libs/storage/redis_storage')

const a = new MemStorage()
console.log(a)
console.log(a.rpush(1))
console.log(a)
console.log(a.llen())
console.log(a.lpop())
console.log(a.rpush(1))
console.log(a)
console.log(a.clear().then(_ => console.log(34)))
console.log(a)



const redisStorage = new RedisStorage()
redisStorage.llen()
  .then(_ => console.log(_))
  .then(_ => redisStorage.close())