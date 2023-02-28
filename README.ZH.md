# ReviewPic Bot

> [简体中文](./README.ZH.md)|[English](./README.md)

* 一个用于搜索图片的 tg 机器人
* 善用搜索模式，你最终会知道它是什么, 它有什么用...

## RoadMap

* 详见 [Project](https://github.com/IITII/tg_setu_bot/projects/1)

## 功能

* 支持自动解析筛选消息里面的有效链接
* 对接多个网站, 并支持在之上做聚合查询
* TG 消息添加 MarkUp 按钮支持, 减少了页面切换的繁琐, 一键下载/订阅
* 消息解耦，下载和回复分别做了消息解耦，更便于流量控制
* 支持多种下载模式
* 回复时支持引用上文
* 图片过多时自动切分回复

## Run

> 最少需要注册两个 bot, 一个用于搜索, 一个用于订阅  

* 获取 [Telegram Bot Token](https://sendpulse.com/knowledge-base/chatbot/create-telegram-chatbot)
* git clone
* npm i
* export BOT_TOKEN=token1 SUBSCRIBE_TOKEN=token2 && npm start
* 在 Telegram 上面与 bot 对话即可

## Support Command

|    Name    |      Des       |
|:----------:|:--------------:|
|   /start   |    Hello消息     |
| /download  |      仅下载       |
| /copy_del  |    仅发送到 TG     |
|  /search   |      搜索图片      |
|    /sub    |       订阅       |
|   /u_sub   |      移除订阅      |
|   /unset   |   清空session    |
| ~~/clean~~ | ~~删除所有远程临时文件~~ |

## ENV

|    Name     |        Des         | Default |
|:-----------:|:------------------:|:-------:|
|  BOT_TOKEN  | Telegram Bot Token | `NULL`  |
|  ADMIN_ID   |  启停消息发送到 ADMIN_ID  | `NULL`  |
|    PROXY    |      Http 代理       | `NULL`  |
|    LIMIT    |      图片下载并发上限      |  `10`   |
| SEND_TO_SUB |   是否将搜索结果发送到订阅频道   | `false` |

