# ReviewPic Bot

* 正如你所见，这只是一个简单的 tg 机器人而已

## 功能

* 支持自动解析筛选消息里面的有效链接
* 消息解耦，下载和回复分别做了消息解耦，更便于流量控制
* 支持多种下载模式
* 回复时支持引用上文
* 图片过多时自动切分回复

## RoadMap

* 详见 [Project](https://github.com/IITII/tg_setu_bot/projects/1)

## ENV

|   Name    |                    Des                    | Default |
|:---------:|:-----------------------------------------:|:-------:|
| BOT_TOKEN |            Telegram Bot Token             | `NULL`  |
|   PROXY   |                Http Proxy                 | `NULL`  |
|   LIMIT   | Concurrency limit when downloading images |  `10`   |

