/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/09
 */
'use strict'

const {chunk} = require('lodash')
const {reqRateLimit, currMapLimit} = require('../libs/utils')

async function one(){
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(1)
      return resolve(1)
    }, 1000)})
    .then(() => console.log(new Date()))
}

function two() {
  console.log(2)
}


function three() {
  return Promise.resolve(3)
    .then(() => console.log(new Date().getSeconds()))
}


async function main() {
// currMapLimit([1, 2, 3], 1, one)
// rateLimit([1, 2, 3], 1, one)
  await reqRateLimit(one, [1, 2, 3], 1)

// rateLimit([1,2,3,4,5,6,7,8,9,10], 10000, 10, false, one)
  await reqRateLimit(one, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  await reqRateLimit(two, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
// rateLimit(three, [1,2,3,4,5,6,7,8,9,10], 1000)
}

// main()

function ones() {
  console.log(new Date())
}
function f2() {
  console.log(new Date())
}

async function t2() {
  console.log("一秒钟一条")
  await reqRateLimit(ones, [1,2,3,4,5,6,7,8,9,10], 1000, 1, false)
  console.log("一分钟20条")
  await reqRateLimit(f2, [...new Array(20).keys()], 1000 * 60 / 20, 1, false)
}

t2()