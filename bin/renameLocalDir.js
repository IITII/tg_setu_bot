/**
 * 文件夹名称格式化, 将之前的文件夹按新逻辑重新格式化
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/09/01
 */
'use strict'

const fs = require('fs')
const path = require('path')
const {format_sub_title} = require('../libs/utils')
const base = process.env.TG_BASE || '.'

const exi = []
fs.readdirSync(base)
  .map(f => {
    const ff = format_sub_title(f, ' ')
    if (ff !== f) {
      console.log(`${f} -> ${ff}\n`)
      const i = path.resolve(base, f)
      const o = path.resolve(base, ff)
      if (fs.existsSync(o)) {
        exi.push([i, o])
      } else {
        fs.renameSync(i, o)
      }
    }
  })
exi.forEach(([i, o]) => {
  console.log(`${o} is already exist`)
  // fs.unlinkSync(i)
})