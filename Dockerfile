FROM node:slim

ENV PORT 3000
ENV BOT_TOKEN '1286442836:AAGkWV6wy4tBwCiGCC3K6BODeuqHmqd8AFo'
#ENV

COPY . /app

#VOLUME /app/node_modules

WORKDIR /app

RUN npm i

#RUN npm install -g pm2

EXPOSE 3000 9229

CMD ["npm", "start"]