FROM mhart/alpine-node:4.4.7

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ARG PROXY_URL
RUN npm config set proxy $PROXY_URL
RUN npm config set https-proxy $PROXY_URL
# RUN npm config set registry http://registry.npmjs.org/
RUN npm set progress=false

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

RUN npm config delete proxy
RUN npm config delete https-proxy

CMD [ "node", "./bin/www" ]
