/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/27
 */
'use strict'
const Telegraph = require('./telegraph'),
    telegraph = new Telegraph()
const Eveira = require('./Eveira'),
    eveira = new Eveira()
const EveiraTags = require('./tags/eveira_tags'),
    eveiraTags = new EveiraTags()


module.exports = {
  telegraph,
  eveira,
  eveiraTags,
}