/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/26
 */
'use strict'
const Axios = require('axios'),
  {axios: axiosConf} = require('../config/config')

module.exports = Axios.create(axiosConf)