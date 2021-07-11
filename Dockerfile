FROM node:12

WORKDIR /dockerProject

RUN pwd
RUN echo ${PWD}

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]