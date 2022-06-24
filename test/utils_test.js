/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const {sleep, currMapLimit, time_human_readable} = require('../libs/utils')


async function sleep1(ms) {
  console.log(`sleep ${ms}ms`)
  return sleep(ms).then(() => console.log(`sleep ${ms}ms end`))
}

currMapLimit([1000, 2000, 3000], 1, sleep1)
  .then(() => console.log('end'))
  .catch(e => console.log(e))

console.log(time_human_readable(1000))
console.log(time_human_readable(1200))
console.log(time_human_readable(2200))
console.log(time_human_readable(1100.12 * 60))
console.log(time_human_readable(1200.12 * 60 * 60))
console.log(time_human_readable(1000.12 * 60 * 60 * 24))