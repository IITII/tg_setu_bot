/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/27
 */
'use strict'
const Telegraph = require('./sites/Telegraph'),
  telegraph = new Telegraph()
const Eveira = require('./sites/Eveira'),
  eveira = new Eveira()
const EveiraTags = require('./sites/EveiraTags'),
  eveiraTags = new EveiraTags()
const Fa24 = require('./sites/Fa24'),
  fa24 = new Fa24()
const Fa24Tags = require('./sites/Fa24Tags'),
  fa24Tags = new Fa24Tags()
const junMei = require('./sites/JunMei'),
  busTags = require('./sites/BusTags'),
  dongTi = require('./sites/DongTi'),
  dongTiTags = require('./sites/DongTiTags'),
  dongTiTagsTu = require('./sites/DongTiTagsTu'),
  junMeiTags = require('./sites/JunMeiTags')


module.exports = {
  telegraph,
  eveira,
  eveiraTags,
  fa24,
  fa24Tags,
  junMei,
  junMeiTags,
  busTags,
  dongTi,
  dongTiTags,
  dongTiTagsTu,
}