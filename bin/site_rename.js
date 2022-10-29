/**
 * 用于站点域名更换的情况
 */

'use strict'
const pre_domain = '',
    curr_domain = ''

const redis = require('../libs/redis_client')
const {HGETALL} = require('../services/utils/redis_utils')
const {taskLimit, taskName} = require('../config/config')
const {reformat_keys} = require("./redis_sub_utils");

function replace(url, pre = pre_domain, cur = curr_domain) {
    let u = new URL(url)
    if (u.hostname === pre) {
        u.hostname = cur
    }
    return u.toString()
}

async function reformat_sub() {
    const all = await HGETALL()
    let diff = []
    for (let s in all) {
        let info = all[s],
            ss = replace(s)
        if (s !== ss && !all[ss]) {
            console.log(`${s} -> ${ss}`)
            info.latest = info.latest.map(e => replace(e))
            diff.push([s, ss, info])
        }
    }
    console.log(`affects: ${diff.length}`)
    const mul = redis.multi()
    diff.forEach(d => {
        const [s, ss, info] = d
        mul.HSETNX(taskName, ss, JSON.stringify(info))
        mul.HDEL(taskName, s)
    })
    await mul.exec()
    await redis.quit()
}

reformat_keys(replace, taskLimit.sub_prefix.url)
    .then(reformat_sub)
    .catch(e => console.log(e))
