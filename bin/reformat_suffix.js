/**
 * 重新格式化文件后缀名
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/09/22
 */
'use strict'

const fs = require('fs')
const path = require('path')
const {logger} = require('../middlewares/logger')
const base = process.env.TG_BASE || '/Volumes/DATA/A/tg/'

dfs(base)
logger.info(`${base} done!`)

function dfs(dir, allowTypes = /\.(jpe?g|png|webp|jiff)/) {
  const files = fs.readdirSync(dir)
  if (files.length === 0) {
    logger.warn(`rm empty dir ${dir}`)
    fs.rmdirSync(dir)
    return
  }
  files.forEach(f => {
    let p1 = path.resolve(dir, f)
    if (fs.statSync(p1).isDirectory()) {
      dfs(p1)
    } else if (fs.statSync(p1).isFile()) {
      format(p1, allowTypes)
    } else {
      logger.warn(`unknown file type: ${p1}`)
    }
  })
}

function format(pt, allowTypes) {
  const suffix = path.extname(pt)
  if (suffix && suffix.match(allowTypes)) {
    let idx = suffix.indexOf('?')
    let suf = idx > -1 ? suffix.substring(0, idx) : suffix
    if (suffix === suf) return
    logger.debug(`File suffix ${suffix} => ${suf}`)
    const p2 = path.format({
      dir: path.parse(pt).dir,
      name: path.parse(pt).name,
      ext: suf,
    })
    logger.info(`rename ${pt} => ${p2}`)
    fs.renameSync(pt, p2)
  }
}