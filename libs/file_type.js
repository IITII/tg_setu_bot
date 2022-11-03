/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/06/24
 */
'use strict'
const {axios} = require('./axios_client')
const NO_CONTENT_TYPE_E_MSG = 'no-content-type'
let file_type = null

async function init() {
  if (file_type) {
    return
  }
  file_type = await import('file-type')
}

async function fileTypeFromUrlHead(url) {
  return axios.head(url)
    .then(res => {
      const contentType = res.headers['content-type']
      if (contentType) {
        const type = contentType.split('/')[1]
        return {ext: type, mime: contentType}
      }
      throw new Error(NO_CONTENT_TYPE_E_MSG)
    })
}

async function fileTypeFromUrl(url) {
  await init()
  return axios.get(url, {responseType: 'stream'})
    .then(res => file_type.fileTypeFromStream(res.data))
}

async function fileTypeFromBuffer(buffer) {
  await init()
  return await file_type.fileTypeFromBuffer(buffer)
}

async function fileTypeFromFile(filePath) {
  await init()
  return await file_type.fileTypeFromFile(filePath)
}

module.exports = {
  fileTypeFromUrlHead,
  fileTypeFromUrl,
  fileTypeFromBuffer,
  fileTypeFromFile,
  NO_CONTENT_TYPE_E_MSG,
}