
const EveiraTags = require('../../../libs/download/sites/EveiraTags.js'),
  eveiraTags = new EveiraTags()

let url, res

url = ''


async function test() {
    res = await eveiraTags.getTagUrls(url)
    console.log(res);
}

test()