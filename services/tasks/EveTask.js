/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/26
 */
'use strict'
const redis = require('redis'),
  {taskName} = require('../../config/config'),
  taskKey = taskName.eveTask,
  {get_dom} = require('../../libs/download/dl_utils')

async function add_sub() {

}

async function remove_sub() {

}

function message_decode(ctx) {
  const message = ctx.message.text.split(' ')

}