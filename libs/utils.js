module.exports = {
  mkdir,
  isNil,
  mediaType,
  splitArray,
  spendTime,
  zipDir,
  rm_rf
};

const fs = require('fs');
const path = require('path');

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
    return [array];
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
  console.log(`Split to ${subArray.length} parts.`);
  return subArray;
}

/**
 * Calc how much time spent on run function.
 * @param func Run function
 * @param args function's args
 */
async function spendTime(func, ...args) {
  return await new Promise(async (resolve, reject) => {
    let start = new Date();
    try {
      await func.apply(this, args);
      return resolve();
    } catch (e) {
      console.error(e);
      return reject();
    } finally {
      let cost = new Date() - start;
      let logInfo = cost > 1000 ? cost / 1000 + 's' : cost + 'ms';
      console.info(`Total spent ${logInfo}.`);
    }
  });
}

/**
 * only compress dir under given `dirname`
 * @param dirName compress dirname
 * @param zipFileName compressed filename
 * @see https://github.com/cthackers/adm-zip
 * @description docs is out-of-date
 * Unsupported chinese folder name
 */
async function zipDir(dirName, zipFileName) {
  return await new Promise(async (resolve, reject) => {
    try {
      const adm_zip = require("adm-zip"),
        zip = new adm_zip();
      
      // let files = fs.readdirSync(dirName);
      // for (const file of files) {
      //   let filePath = dirName + path.sep + file;
      //   if (fs.lstatSync(filePath).isDirectory()) {
      //     await zip.addLocalFolder(filePath, path.relative(dirName, filePath));
      //   }
      // }
      await zip.addLocalFolder(dirName);
      zip.writeZip(zipFileName, (err) => {
        if (err) {
          console.error(`Compress to ${zipFileName} failed...`);
          return;
        }
        console.info(`Compress to ${zipFileName} success.`)
      });
      return resolve();
    } catch (e) {
      return reject(e);
    }
  })
}

/**
 * remove a dir or a file, just like: rm -rf ${path}
 * @param deletePath {String} file path to be delete,(absolute or relative)
 */
function rm_rf(deletePath) {
  let absDeletePath = path.resolve(__dirname, deletePath);
  if (fs.existsSync(absDeletePath)) {
    if (fs.statSync(absDeletePath).isDirectory()) {
      let files = fs.readdirSync(absDeletePath);
      // if dir is empty, direct delete it
      if (files.length === 0) {
        return fs.rmdirSync(absDeletePath);
      }
      files.forEach(file => {
        let tmp = absDeletePath + path.sep + file;
        if (fs.statSync(tmp).isDirectory()) {
          rm_rf(tmp);
        } else {
          fs.unlinkSync(tmp);
        }
      });
    } else {
      fs.unlinkSync(absDeletePath);
    }
  } else {
    console.log(`${absDeletePath} is not exist. \nNothing to do.`)
  }
}