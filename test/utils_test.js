/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const {sleep, currMapLimit} = require('../libs/utils')


async function sleep1(ms) {
  console.log(`sleep ${ms}ms`)
  return sleep(ms).then(() => console.log(`sleep ${ms}ms end`))
}

currMapLimit([1000, 2000, 3000], 1, sleep1)
  .then(() => console.log('end'))
  .catch(e => console.log(e))