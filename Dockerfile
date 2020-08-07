FROM node:slim

ENV PORT 3000
ENV BOT_TOKEN ""
ENV PROXY ""
ENV APPEND_TO_FILE ""
ENV LOG_NAME ""
ENV LOG_LEVEL ""
ENV LOG_DIR ""
ENV PIXIV_USERNAME ""
ENV PIXIV_PASSWORD ""

COPY . /app

WORKDIR /app

#RUN sed 's/deb.debian.org/mirrors.aliyun.com/g' -i /etc/apt/sources.list
# Chrome
RUN npm i && \
apt-get update && \
apt install -y chromedriver chromium && \
apt clean && rm -rf /tmp/* && \
date

#RUN npm install -g pm2

#EXPOSE 3000 9229

CMD ["npm", "start"]