FROM mhart/alpine-node:4.4.7

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# set Node to production
ARG NODE=production
ENV NODE_ENV ${NODE}

RUN apk add --no-cache --virtual \
    bash \
  && rm -rf /var/cache/apk/*

# Install app dependencies
COPY package.json /tmp/package.json
RUN cd /tmp && npm install && cp -a /tmp/node_modules /usr/src/app/ && rm -rf /tmp/* && npm install -g knex

# Bundle app source
COPY . /usr/src/app
COPY ./.env.default /usr/src/app/.env

EXPOSE 3000

CMD [ "node", "./bin/www" ]
