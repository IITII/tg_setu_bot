# ReviewPic Bot

> [简体中文](./README.ZH.md)|[English](./README.md)

* An asian pic bot for telegram. Cosplay, Photograph, Anime, etc.

* Use the search mode well, you will eventually know what it is, what it is for...

## RoadMap

* See: [Project](https://github.com/IITII/tg_setu_bot/projects/1)

## Highlights

* Support automatic parsing of valid links in filtered messages
* Adjust for multiple websites and support aggregation queries on them
* Added MarkUp button support, reducing the tedious page switching, one-click download/subscribe
* Message decoupling, message decoupling for download and reply, which is more convenient for flow control
* Support multiple download modes
* Support citing the above when replying
* Automatically split and reply when there are too many pictures

## Run

> At least two bots need to be registered, one for search and one for subscription  

* Get [Telegram Bot Token](https://sendpulse.com/knowledge-base/chatbot/create-telegram-chatbot)
* git clone
* npm i
* export BOT_TOKEN=token1 SUBSCRIBE_TOKEN=token2 && npm start
* Chat with your bot

## Support Command

|    Name    |                     Des                     |
|:----------:|:-------------------------------------------:|
|   /start   |                  Hello Msg                  |
| /download  |                  download                   |
| /copy_del  |              direct send to TG              |
|  /search   |                 search mode                 |
|    /sub    |  Subscribe to receive the latest pictures   |
|   /u_sub   | UN-Subscribe to receive the latest pictures |
|   /unset   |                clear session                |
| ~~/clean~~ |          ~~Remove all temp files~~          |

## ENV

|    Name     |                    Des                    | Default |
|:-----------:|:-----------------------------------------:|:-------:|
|  BOT_TOKEN  |            Telegram Bot Token             | `NULL`  |
|  ADMIN_ID   |    Send start/stop message to ADMIN_ID    | `NULL`  |
|    PROXY    |                Http Proxy                 | `NULL`  |
|    LIMIT    | Concurrency limit when downloading images |  `10`   |
| SEND_TO_SUB |         Send search result to sub         | `false` |

