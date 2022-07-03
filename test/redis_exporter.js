/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/07/03
 */
'use strict'
const fs = require('fs')
const file = './redis_exporter.json'
const {HGETALL} = require('../services/tasks/redis_utils')
const {taskName} = require('../config/config')

async function sub_exporter() {
  const all = await HGETALL(taskName)

  if (all) {
    console.log(`export ${Object.keys(all).length} to ${file}`)
    fs.writeFileSync(file, JSON.stringify(all, null, 2))
  } else {
    console.log(`export 0 to ${file}`)
  }
}

sub_exporter().then(_ => console.log('sub_exporter done'))