/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/07/03
 */
'use strict'


function f1(a, b, c) {
  arg(a, b, c)
}

function arg(...args) {
  console.log(args)
  console.log({...args})
  f2(...args)
}

function f2(a, b, c) {
  console.log(a, b, c)
}

f1(1, 2, 3)
f1(4, 5, 6)