FROM node:12

WORKDIR /src

COPY package*.json ./

RUN npm install

ENV PORT=3000

EXPOSE 3000
