# ReviewPic Bot
> [简体中文](./README.ZH.md)|[English](./README.md) 


* 正如你所见，这只是一个简单的 tg 机器人而已

## RoadMap

* 详见 [Project](https://github.com/IITII/tg_setu_bot/projects/1)

## 功能

* 支持自动解析筛选消息里面的有效链接
* 消息解耦，下载和回复分别做了消息解耦，更便于流量控制
* 支持多种下载模式
* 回复时支持引用上文
* 图片过多时自动切分回复

## Run

* 获取 [Telegram Bot Token](https://sendpulse.com/knowledge-base/chatbot/create-telegram-chatbot)
* git clone
* npm i
* npm start
* 在 Telegram 上面与 bot 对话即可

## Support Command

|   Name    |                Des                 |
| :-------: | :--------------------------------: |
|  /start   |             Hello消息              |
| /download |               仅下载               |
|   /copy   |          下载后发送回会话          |
| /copydel  | 下载后发送回会话并删除远程临时文件 |
|  /clean   |        删除所有远程临时文件        |


## ENV

|   Name    |           Des           | Default |
| :-------: | :---------------------: | :-----: |
| BOT_TOKEN |   Telegram Bot Token    | `NULL`  |
| ADMIN_ID  | 启停消息发送到 ADMIN_ID | `NULL`  |
|   PROXY   |        Http 代理        | `NULL`  |
|   LIMIT   |    图片下载并发上限     |  `10`   |

