/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/08/29
 */
'use strict'


const redis = require('../libs/redis_client')
const {get_sent_sub} = require('../services/tasks/redis_utils')
const {taskLimit} = require('../config/config')
const {format_sub_title} = require('../libs/utils')

async function main(prefix = taskLimit.sub_prefix, expire = taskLimit.sub_expire) {
  const sent_texts = await get_sent_sub(taskLimit.sub_prefix.text)
  let diff = []
  sent_texts.forEach(s => {
    const ss = format_sub_title(s)
    if (ss !== s) {
      console.log(`${s} -> ${ss}`)
      diff.push([s, ss])
    }
  })
  console.log(`Reformat: ${diff.length}`)
  const v = `reformat at ${new Date()}`
  const mul = redis.multi()
  diff.forEach(d => {
    const [s, ss] = d
    mul.DEL(`${prefix.text}${s}`)
    mul.SETEX(`${prefix.text}${ss}`, expire, v)
  })
  await mul.exec()
  await redis.quit()
}

main()
  .catch(e => console.log(e))