# tg_setu_bot
> A bot for telegram  

# ENV

|Name|Des|Default|
|:--:|:--:|:--:|
|BOT_TOKEN|Telegram Bot Token|`NULL`|
|PROXY|Http Proxy|`NULL`|
|APPEND_TO_FILE|while `true`, log will append to log file & no output for console|`false`|
|LOG_NAME|logger category name|`tg_setu`|
|LOG_LEVEL|logger level|`debug`|
|LOG_DIR|logger file path|`./logs/tg_setu.log`|

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