FROM node:slim

ENV PORT 3000
ENV BOT_TOKEN null
ENV PROXY null
ENV APPEND_TO_FILE false
ENV LOG_NAME 'tg_setu'
ENV LOG_LEVEL 'debug'
ENV LOG_DIR './logs/tg_setu.log'

COPY . /app

WORKDIR /app

RUN npm i

#RUN npm install -g pm2

#EXPOSE 3000 9229

CMD ["npm", "start"]