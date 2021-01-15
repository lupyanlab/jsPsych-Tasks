FROM node

RUN mkdir /code
WORKDIR /code
RUN npm i -g serve

COPY package-lock.json .
COPY package.json .
RUN npm ci

CMD serve