FROM node:18-alpine

LABEL maintainer="IITII <ccmejx@gmail.com>"

ADD . /app
#RUN mkdir
WORKDIR /app
VOLUME ["/app/db", "/app/tmp", "/app/logs"]

RUN npm i

CMD ["npm", "start"]
