/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/25
 */
'use strict'
const {get_dom} = require('./dl_utils')
module.exports = class AbsDownloader {
  constructor() {
    this.name = this.constructor.name
  }

  async getImageArray(url) {
    return get_dom(url, this.handle_dom)
  }

  async handle_dom($, original) {
    throw new Error('un-support')
  }
}