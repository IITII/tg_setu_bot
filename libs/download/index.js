/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/27
 */
'use strict'
const Telegraph = require('./telegraph'),
    dl_tg = new Telegraph().getImageArray
const Eveira = require('./Eveira'),
    dl_eve = new Eveira().getImageArray
const EveiraTags = require('./tags/eveira_tags'),
    dl_eve_tag = new EveiraTags().getImageArray


module.exports = {
  dl_tg,
  dl_eve,
  dl_eve_tag,
}