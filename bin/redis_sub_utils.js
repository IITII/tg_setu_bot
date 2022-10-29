const {taskLimit} = require("../config/config");
const {get_sent_sub} = require("../services/utils/redis_utils");
const redis = require("../libs/redis_client");


async function reformat_keys(func, prefix, expire = taskLimit.sub_expire) {
    const sent_urls = await get_sent_sub(prefix)
    let diff = []
    sent_urls.forEach(s => {
        let ss = func(s)
        if (s !== ss) {
            console.log(`${s} -> ${ss}`)
            diff.push([s, ss])
        }
    })
    console.log(`affects: ${diff.length}`)
    const v = `reformat at ${new Date()}`
    const mul = redis.multi()
    diff.forEach(d => {
        const [s, ss] = d
        mul.DEL(`${prefix}${s}`)
        mul.SETEX(`${prefix}${ss}`, expire, v)
    })
    await mul.exec()
    await redis.quit()
}

module.exports = {
    reformat_keys,
}
