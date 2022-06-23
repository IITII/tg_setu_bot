# ReviewPic Bot
> [简体中文](./README.ZH.md)|[English](./README.md)  

* Just a Simple Telegram bot

## RoadMap

* See: [Project](https://github.com/IITII/tg_setu_bot/projects/1)

## Highlights

* Support automatic parsing of valid links in filtered messages
* Message decoupling, message decoupling for download and reply, which is more convenient for flow control
* Support multiple download modes
* Support citing the above when replying
* Automatically split and reply when there are too many pictures

## Run

* Get [Telegram Bot Token](https://sendpulse.com/knowledge-base/chatbot/create-telegram-chatbot)
* git clone
* npm i
* npm start
* Chat with your bot

## Support Command

|   Name    |                       Des                        |
| :-------: | :----------------------------------------------: |
|  /start   |                    Hello Msg                     |
| /download |                     download                     |
|   /copy   |           Send to chat after download            |
| /copydel  | Send to chat after download and delete tmp files |
|  /clean   |              Remove all temp files               |



## ENV

|   Name    |                    Des                    | Default |
| :-------: | :---------------------------------------: | :-----: |
| BOT_TOKEN |            Telegram Bot Token             | `NULL`  |
| ADMIN_ID  |    Send start/stop message to ADMIN_ID    | `NULL`  |
|   PROXY   |                Http Proxy                 | `NULL`  |
|   LIMIT   | Concurrency limit when downloading images |  `10`   |

