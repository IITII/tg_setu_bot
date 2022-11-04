/**
 * 删除 redis 里不符合要求的信息
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/11/04
 */
'use strict'
const {queueName} = require('../config/config')
const redis = require('../libs/redis_client')

Promise.resolve()
  .then(_ => redis.connect())
  .then(_ => {
    let keep = []
    redis.LRANGE(queueName.msg_send, 0, -1).then(async r => {
      r.forEach(e => {
        if (!e.includes('jdlingyu')) {
          keep.push(e)
        }
      })
      console.log(`${r.length} -> ${keep.length}`)
      await redis.DEL(queueName.msg_send)
      const mul = redis.multi()
      keep.forEach(k => {
        mul.RPUSH(queueName.msg_send, k)
      })
      await mul.exec()
      return redis.quit()
    })
  })