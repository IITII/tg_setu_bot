/**
 * 从 dict.txt 加载字典, 并按字典里面的名称移动文件夹
 * 按字典顺序可以指定优先级
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/09/22
 */
'use strict'
const fs = require('fs'),
  path = require('path')
const dayjs = require('dayjs')
const {logger} = require('../middlewares/logger')
const userDict = process.env.TG_USER_DICT || path.resolve(__dirname, './dict.txt')
const base = process.env.TG_BASE || '.'

main(base)

function loadDict(dict) {
  const c = fs.readFileSync(dict).toString()
  return c.split('\n')
    .map(_ => _.trim())
    .filter(_ => _.length > 0)
    .map(_ => _.split(' ')[0])
}

function curr_day(format = 'YYYY.MM.DD') {
  return dayjs().format(format)
}

function main(dir) {
  dir = dir.trim()
  const dict = loadDict(userDict)
  const curr_d = curr_day()
  fs.readdirSync(dir)
    .map(_ => path.resolve(dir, _))
    .filter(_ => fs.statSync(_).isDirectory())
    .map(_ => path.basename(_))
    .forEach(b => {
      const d = dict.find(_ => b.includes(_)) || curr_d
      // 避免自己移动自己
      if (d !== b) {
        moveTo(d, b)
      }
    })
  logger.info(`${dir} done!`)
}

function moveTo(b, from) {
  if (!fs.existsSync(b)) {
    logger.info(`create dir ${b}`)
    fs.mkdirSync(b)
  }
  const to = path.resolve(b, from.trim())
  logger.info(`move ${from} to ${to}`)
  fs.renameSync(from, to)
}