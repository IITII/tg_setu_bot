# tg_setu_bot
> A bot for telegram  

## Command
> Bot father ⇒ Edit Bot ⇒ Edit Commands  

```text
top - Pixiv Daily Ranking
taotu - Link
echo - Echo bot
help - Help
```

## ENV

|Name|Des|Default|
|:--:|:--:|:--:|
|BOT_TOKEN|Telegram Bot Token|`NULL`|
|PROXY|Http Proxy|`NULL`|
|APPEND_TO_FILE|while `true`, log will append to log file & no output for console|`false`|
|LOG_NAME|logger category name|`tg_setu`|
|LOG_LEVEL|logger level|`debug`|
|LOG_DIR|logger file path|`./logs/tg_setu.log`|
|PIXIV_USERNAME|PIXIV USERNAME|`NULL`|
|PIXIV_PASSWORD|PIXIV PASSWORD|`NULL`|
|PIXIV_TMP_FILE|Temp file to save pixiv daily ranking data|`../tmp/pixiv.json`|
|SAVE_DIR|Directory to save downloaded pixiv images and zipped file|`../tmp/`|
|LIMIT| Concurrency limit when downloading pixiv images|`10`|

## RUN

```bash
# Using npm
npm i && npm start
# Using pm2
npm i pm2 -g
pm2 [start|restart|stop|delete] ecosystem.config.js
pm2 start ecosystem.config.js --only TG_SETU_BOT
pm2 deploy ecosystem.config.js staging
pm2 deploy ecosystem.config.js production setup && pm2 deploy ecosystem.config.js production
```

### Docker
> docker build -t tg_setu:latest .  
> docker pull tg_setu:latest
```bash
# No proxy
docker run -d \
--name tg_setu_bot \
-e BOT_TOKEN=<BOT_TOKEN> \
-e PROXY="" \
-e APPEND_TO_FILE='' \
-e LOG_NAME="tg_setu" \
-e LOG_LEVEL="debug" \
-e LOG_DIR="/app/logs/tg_setu.log" \
tg_setu:latest

# With proxy
docker run -d \
--name tg_setu_bot \
-e BOT_TOKEN=<BOT_TOKEN> \
-e PROXY="http://192.168.1.1:1080" \
-e APPEND_TO_FILE='' \
-e LOG_NAME="tg_setu" \
-e LOG_LEVEL="debug" \
-e LOG_DIR="/app/logs/tg_setu.log" \
tg_setu:latest
```