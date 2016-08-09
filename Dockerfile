#FROM node:4.4.7-slim
FROM mhart/alpine-node:4.4.7
RUN apk add --no-cache bash

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# set Node to production
ARG NODE=production
ENV NODE_ENV ${NODE}

# Install app dependencies
COPY package.json /tmp/package.json
RUN cd /tmp && npm install
RUN cp -a /tmp/node_modules /usr/src/app/
RUN npm install -g knex

# Bundle app source
COPY . /usr/src/app

EXPOSE 3000

CMD [ "node", "./bin/www" ]
