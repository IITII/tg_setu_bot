module.exports = {
  mkdir,
  isNil,
  mediaType,
  asyncLimit,
  splitArray
};

const fs = require('fs');
const path = require('path');
const async = require('async');

function mkdir(dir, cb) {
  let paths = dir.split(path.sep);
  let index = 1;
  
  function next(index) {
    //递归结束判断
    if (index > paths.length)
      return cb();
    let newPath = paths.slice(0, index).join(path.sep);
    fs.access(newPath, function (err) {
      if (err) {//如果文件不存在，就创建这个文件
        fs.mkdir(newPath, function () {
          next(index + 1);
        });
      } else {
        //如果这个文件已经存在，就进入下一个循环
        next(index + 1);
      }
    })
  }
  
  next(index);
}

/**
 * Checks if value is null or undefined or ''.
 * @param object object
 * @return {boolean} true for nil or ''
 */
function isNil(object) {
  return (object == null) || (object === '');
}

/**
 * Get file's mediaType
 * @param filename {String} filename || url
 * @return {string} Input file's mediaType
 * @see https://core.telegram.org/bots/api#inputmedia
 */
function mediaType(filename) {
  const suffix = {
    "video": [
      ".avi",
      ".flv",
      ".mkv",
      ".mov",
      ".mp4",
      ".mpg",
      ".ogv",
      ".webm",
      ".wmv",
      ".swf"
    ],
    "audio": [
      ".aac",
      ".flac",
      ".mid",
      ".midi",
      ".mp3",
      ".ogg",
      ".wma",
      ".wav"
    ],
    "photo": [
      ".png",
      ".jpg",
      ".jpeg",
      ".svg",
      ".bmp",
      ".ico",
      ".pcx",
      ".tif",
      ".raw",
      ".tga"
    ],
    "animation": [
      ".gif"
    ]
  }
  for (const subSuffix in suffix) {
    if (suffix[subSuffix].indexOf(path.extname(filename)) >= 0) {
      return subSuffix;
    }
  }
  return "document";
}

/**
 * Concurrency
 * @param array InputArray
 * @param limit Concurrency
 * @param func Run function
 * @param args Arguments for func
 */
async function asyncLimit(array, limit, func, ...args) {
  return await new Promise(async (resolve) => {
    await async.mapLimit(array, limit, async function (subArray, callback) {
      await func.apply(this, subArray);
      return callback();
    });
    return resolve();
  })
}

/**
 * telegram sendMessage() method maximum message length is 4096 characters
 * @param array array
 * @param limit MAX_LENGTH, default 4096
 * @param split split, like ' ', '\n'
 * @param start array index start
 * @param end array index end
 * @return {Array} Array
 * @description <code>
 *   const array = ["11","12","13","14","15","16","17"];
 *   console.log(splitArray(array,2,'\n'))
 * </code>
 */
function splitArray(array, split, limit = 4096, start = 0, end = 0) {
  if (array.join(split).length < limit) {
    return array;
  }
  const ARRAY_LENGTH = array.length;
  let subArray = [];
  // 一般都是长度相同
  end = Math.floor(limit / array[0].length) - 1;
  while (end <= ARRAY_LENGTH) {
    let tmpArray = array.slice(start, end);
    if (tmpArray.join(split).length < limit) {
      subArray.push(tmpArray);
      if (end === ARRAY_LENGTH - 1) {
        break;
      }
      start = end;
      // over bound check
      end = end * 2 >= ARRAY_LENGTH ? ARRAY_LENGTH - 1 : end * 2;
    } else {
      end -= 1;
    }
  }
  console.log(subArray.length)
  return subArray;
}