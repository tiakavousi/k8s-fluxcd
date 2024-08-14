FROM node:alpine3.19

RUN /usr/local/bin/npm install http-server -g --only=production

COPY app /app

WORKDIR /app

EXPOSE 8080

ENV COLOR_BACKGROUND="white"
ENV COLOR_PORT="8080"

CMD ["/usr/local/bin/node", "/app/webserver.js"]
