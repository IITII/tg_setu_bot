/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/07/15
 */
'use strict'

const redis_utils = require('../services/tasks/redis_utils')

redis_utils.get_sent_sub().then(subs => console.log(subs))
redis_utils.set_sent_sub([1,2,3,4,5,6]).then(subs => console.log(subs))
redis_utils.get_sent_sub().then(subs => console.log(subs))