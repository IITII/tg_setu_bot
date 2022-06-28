/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/28
 */
'use strict'
const fs = require('fs'),
  path = require('path')
const b = '.'
fs.readdirSync(b)
  .filter(_ => fs.statSync(_).isDirectory())
  .forEach(d => {
    const dir = path.join(b, d)
    fs.readdirSync(dir)
      .filter(_ => _.endsWith('.aspx'))
      .forEach(f => {
        const file = path.join(dir, f)
        console.log(`rm ${file}`)
        fs.unlinkSync(file)
      })
    if (fs.readdirSync(dir).length === 0) {
      console.log(`rm empty dir ${dir}`)
      fs.rmdirSync(dir)
    }
  })