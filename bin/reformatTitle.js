/**
 * 将之前的 redis 里面的信息按新逻辑重新格式化
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/08/29
 */
'use strict'

const {taskLimit} = require('../config/config')
const {format_sub_title} = require('../libs/utils')
const {reformat_keys} = require("./redis_sub_utils");

reformat_keys(format_sub_title, taskLimit.sub_prefix.text)
  .catch(e => console.log(e))
