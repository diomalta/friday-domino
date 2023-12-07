FROM node:hydrogen-alpine
WORKDIR /app
ADD package*.json /app
ADD src /app/src
EXPOSE 8000
CMD node src/bot.js