/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/01
 */
'use strict'

class Storage {

  constructor() {
    this.name = this.constructor.name
  }

  async rpush(v) {
    throw new Error('un-support')
  }

  async lpop() {
    throw new Error('un-support')
  }

  async llen() {
    throw new Error('un-support')
  }

  async clear() {
    throw new Error('un-support')
  }
}

module.exports = Storage