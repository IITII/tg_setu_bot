/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/27
 */
'use strict'
const Telegraph = require('./sites/Telegraph'),
  telegraph = new Telegraph()
const Eveira = require('./sites/Eveira'),
  eveira = new Eveira()
const EveiraTags = require('./sites/eveira_tags'),
  eveiraTags = new EveiraTags()
const Fa24 = require('./sites/Fa24'),
  fa24 = new Fa24()


module.exports = {
  telegraph,
  eveira,
  eveiraTags,
  fa24,
}