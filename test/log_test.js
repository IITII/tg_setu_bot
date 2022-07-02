/**
 * @author IITII <ccmejx@gmail.com>
 * @date 2022/05/31
 */
'use strict'
const {logger} = require('../middlewares/logger')

logger.trace('Entering cheese testing')
logger.debug('Got cheese.')
logger.info('Cheese is Comté.')
logger.warn('Cheese is quite smelly.')
logger.error('Cheese is too ripe!')
logger.fatal('Cheese was breeding ground for listeria.')