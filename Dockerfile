FROM node:14

WORKDIR /src

COPY package*.json ./

RUN npm install

ENV PORT=3000

EXPOSE 3000
