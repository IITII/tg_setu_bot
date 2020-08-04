FROM node:slim

ENV PORT 3000
ENV BOT_TOKEN ""
ENV PROXY ""
ENV APPEND_TO_FILE ""
ENV LOG_NAME ""
ENV LOG_LEVEL ""
ENV LOG_DIR ""

COPY . /app

WORKDIR /app

RUN npm i && \
date

#RUN npm install -g pm2

#EXPOSE 3000 9229

CMD ["npm", "start"]