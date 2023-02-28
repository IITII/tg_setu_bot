/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2023/02/27
 */
'use strict'

const {search} = require('../../config/config')
const {send_text, getDoneTextMsg, getTextMsg, getPhotoMsg, sendBatchMsg} = require('../utils/msg_utils.js')
const {searchArr, filterSupStart, handleTagUrl} = require('../utils/support_urls_utils.js')
const {currMapLimit, time_human_readable} = require('../../libs/utils.js')
const {log_url_texts} = require('../utils/service_utils.js')
const {logger} = require('../../middlewares/logger.js')

async function searchMsgRec(ctx) {
  let chatId, msg, text, reply_to_message_id, tags, tagsArr, tagUrls, search_count = 0, search_res,
    start_time = Date.now(), batchMsg
  chatId = ctx.chat.id
  msg = ctx.message || ctx.update.message || ctx.editedMessage
  reply_to_message_id = msg.message_id
  text = msg.text
  if (!text) {
    return ctx.reply('请发送搜索关键词...', {reply_to_message_id})
  }
  await send_text(chatId, '搜索中...', reply_to_message_id)
  tagsArr = searchArr.map(_ => _.replace('{##}', encodeURI(text)))
  tagsArr = filterSupStart(tagsArr, 'tags')
  tagUrls = await currMapLimit(tagsArr, 5, handleTagUrl)
  logger.debug('tagUrls: ', tagUrls)
  tagUrls = tagUrls.filter(_ => _.imgs.length > 0)
  search_count = tagUrls.map(_ => _.imgs).flat(Infinity).length
  logger.debug('search_count: ', search_count, 'tagUrls: ', tagUrls)
  if (search_count === 0) {
    return ctx.reply('未找到相关内容...', {reply_to_message_id})
  }
  search_res = `#Search\n#${text}:\n#Total ${search_count} in ${time_human_readable(Date.now() - start_time)}\n\n`
  tagUrls.forEach(t => {
    const {title, imgs} = t
    search_res += `${title}:\n${log_url_texts(imgs)}\n\n`
  })
  tags = tagUrls.map(_ => {
    const {imgs} = _
    // 只保留部分域名
    let text = new URL(imgs[0].url).hostname
    let url = tagsArr.find(_ => _.includes(text))
    text = text.split('.')
    text.pop()
    text = text.pop()
    return {text, url}
  })
  batchMsg = [getTextMsg(chatId, search_res, reply_to_message_id)]
  batchMsg.push(getDoneTextMsg(chatId, `search res for ${text}`, tags, reply_to_message_id))
  if (search.send_to_sub) {
    tagUrls.map(_ => _.imgs).flat(Infinity).forEach(_ => {
      const {url, text, poster} = _
      const m = `[${text}](${url})`
      const msg = getPhotoMsg(chatId, poster, m, false)
      batchMsg.push(msg)
    })
  }
  return await sendBatchMsg(batchMsg)
}

module.exports = {
  searchMsgRec,
}
