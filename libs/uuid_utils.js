const { v4: uuidv4 } = require('uuid')

function raw_uuid() {
    return uuidv4()
}

function uuid(length = 24) {
    return uuidv4().replace(/-/g, '').slice(0, length)
}

/**
 * prefix length must less than 12
 */
function uuidWithTime(prefix = '') {
    return `${prefix}${Date.now()}_${uuid(8)}`
}

module.exports = {
    raw_uuid,
    uuid,
    uuidWithTime,
}
