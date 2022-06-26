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
    return Promise.resolve(this.data.push(v))
  }

  async lpop() {
    return Promise.resolve(this.data.shift())
  }

  async llen() {
    return Promise.resolve(this.data.length)
  }

  async clear() {
    this.data = []
  }
}

module.exports = MemStorage