/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/01
 */
'use strict'

const Storage = require('./storage')

class MemStorage extends Storage {

  constructor() {
    super()
    this.data = []
  }

  async rpush(v) {
    return this.data.push(v)
  }

  async lpop() {
    return this.data.shift()
  }

  async llen() {
    return this.data.length
  }

  async clear() {
    return this.data = []
  }
}

module.exports = MemStorage