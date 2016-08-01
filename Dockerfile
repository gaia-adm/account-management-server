FROM node:argon

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN cp -a /tmp/node_modules /usr/src/app/


# Bundle app source
ADD . /usr/src/app
RUN npm run build

EXPOSE 3000
EXPOSE 8080

CMD [ "node", "./bin/www" ]
