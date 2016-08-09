# gaia-account-management

This app is build in [NodeJS](https://nodejs.org), with an [Express](https://expressjs.com)-based api and a PostgreSQL database.

## Setup for development
1. Install [NodeJS](https://nodejs.org), which includes the [npm](https://www.npmjs.com/) package manager.
2. Install global dependencies. These can all be installed *without* the global option, but are easier to develop with when done globally. (Install at once: ```npm install -g knex mocha dredd aglio```)  
    1. ```npm install -g knex```
        - [Knex.js](http://knexjs.org/) is a SQL query builder, with a CLI for database [migration](http://knexjs.org/#Migrations-CLI) and [seeding](http://knexjs.org/#Seeds-CLI).
        - File locations
            - Environment config is located in ```knexfile.js```
            - Migration files are located in ```./migrations```
            - Seed files are located in ```./seeds```
        - ```knex migrate:latest``` will update you to the current schema. Optionally, ```--env <env-name>``` will migrate the appropriate DB (defaults to development).
        - ```knex migrate:rollback``` rolls back the schema.
        - ```knex seed:run``` seeds the DB.
    2. ```npm install -g mocha```
        -  [Mocha](https://mochajs.org/) is a test framework. It is used to run the unit and functional tests.
    3. ```npm install -g dredd```
        -  [Dredd](https://github.com/apiaryio/dredd) is an API testing framework. It promotes definition-first API design.
        -  File locations
            -  Config is in ```./dredd.yml```
            -  Hooks (extra test processing) are in ```./dreddhooks.js```
            -  API description file is in ```./api-blueprint/api-description.apib```
        -  ```dredd``` will run the tests according to the config file
        -  ```dredd api-blueprint/api-description.apib http://localhost:3000``` is an example of an explicit blueprint test against a specific URL
    4. ```npm install -g aglio```
        - [Aglio](https://github.com/danielgtaylor/aglio) converts an API description document from markdown into a publishable doc.
        - ```aglio -i api-blueprint/api-description.apib -o api-blueprint/api.html```

3. Install project dependencies. These dependencies are specified in package.json, and will be installed at the project level:
    - ```npm install```

## Docker
- ```docker-compose up``` will start three containers: db, backend, and client
- after bringing up services, any combination of the following commands may be necessary
- ```docker-compose run backend knex migrate:latest``` will migrate to the latest db
- ```docker-compose run backend knex seed:run``` will seed/re-seed the production environment with essential data. It will NOT delete data from the DB instance
- ```docker-compose run backend knex seed:run --env=reset``` will delete everything in the db
    
## Notes for developers
- The front-end app is designed to be written with ES2015 using AngularJS 1.5+, compiled by webpack. [This page](http://angular-tips.com/blog/2015/06/using-angular-1-dot-x-with-es6-and-webpack/) does a really great job of outlining when to use (and not use) classes.
- Injection/annotation is handled by the ngAnnotatePlugin.
