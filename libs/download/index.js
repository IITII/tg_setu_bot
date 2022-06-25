/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/27
 */
'use strict'
const Telegraph = require('./Telegraph'),
  telegraph = new Telegraph()
const Eveira = require('./Eveira'),
  eveira = new Eveira()
const EveiraTags = require('./tags/eveira_tags'),
  eveiraTags = new EveiraTags()
const Fa24 = require('./Fa24'),
  fa24 = new Fa24()


module.exports = {
  telegraph,
  eveira,
  eveiraTags,
  fa24,
}