/**
 * 基本分词
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/09/22
 */
'use strict'
const fs = require('fs'),
  path = require('path')
const jb = require("nodejieba")
const base = process.env.TG_BASE || '.'

const userDict = process.env.TG_USER_DICT || path.resolve(__dirname, './dict.txt')

jb.load({userDict})

function main(dir) {
  fs.readdirSync(dir)
    .map(_ => path.resolve(dir, _))
    .filter(_ => fs.statSync(_).isDirectory())
    .map(_ => path.basename(_))
    .map(_ => [_, jb.cutHMM(_).filter(_ => _.length > 1)])
    .filter(_ => _[1].length > 0)
    .forEach(([basename, hmm]) => {
      console.log(`${basename} => ${hmm.join(', ')}`)
    })
}

main(base)