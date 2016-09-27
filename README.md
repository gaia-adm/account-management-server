[![CircleCI](https://circleci.com/gh/gaia-adm/gaia-account-management-server.svg?style=svg)](https://circleci.com/gh/gaia-adm/gaia-account-management-server)
[![](https://badge.imagelayers.io/gaiaadm/acmserver:latest.svg)](https://imagelayers.io/?images=gaiaadm/acmserver:latest 'Get your own badge on imagelayers.io')


# gaia-account-management

This app is build in [NodeJS](https://nodejs.org), with an [Express](https://expressjs.com)-based api and a PostgreSQL database.

## Setup for development
1. Install PostgreSQL (the site was developed with 9.5, but anything >=9.1 should work)
    - you should use the gaia-account-management-db project for setting this up
2. Install [NodeJS](https://nodejs.org), which includes the [npm](https://www.npmjs.com/) package manager.
3. Install global dependencies. These can all be installed *without* the global option, but are easier to develop with when done globally. (Install at once: ```npm install -g knex mocha dredd aglio```)  
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

4. Install project dependencies. These dependencies are specified in package.json, and will be installed at the project level:
    - ```npm install```
5. Configure your environment
    1. Copy ./.env.default to ./.env and set up appropriate variables
    2. If you choose to use the database named "hpe_account_management," create a DB of that name in your local PostgreSQL instance
    3. Copy ./client/.env.default to ./client/.env and set up appropriate variables
6. INVITATIONS
    - If you need to customize the invitation email:
    - ./views/invitation.pug is the template
    - ./routes/accounts has a method at the top called ```sendInvitation```

## Environment
- You should be able to keep the DB_DATABASE, DB_USER, and DB_PASSWORD as is in most situations where the DB is set up as planned.
- DB_HOST needs to be set properly (default DB_HOST=localhost)
- BACKEND_HOST and BACKEND_PORT determine the host and port of this server setup (default BACKEND_HOST=localhost BACKEND_PORT=3000)
- CLIENT_HOST and CLIENT_PORT should reference the host and port of the client app (default CLIENT_HOST=localhost CLIENT_PORT=8080)
- MAILGUN: For a default environment, you *must* set up your own mailgun account, which will allow you to have 5 email addresses for testing.
    - The site is agnostic, with respect to SMTP, so any SMTP account will ultimately work
    - INVITATION_EMAIL_FROM (whoever the sender is for invitations; default INVITATION_EMAIL_FROM=\[a mailgun email\])
    - SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD must be set

## Commands
- ```npm start``` Production start.
- ```npm run start:dev``` Starts the nodemon server, which restarts the server when a file changes.
- ```npm test``` Runs the mocha tests in the test environment
- ```npm run doc``` Creates a fresh version of the API documentation from the api-blueprint markdown file.
- ```npm run dredd``` Runs API tests with dredd test runner, using the test environment.

## Docker
- ```docker-compose up``` will start three containers: db, backend, and client
- after bringing up services, any combination of the following commands may be necessary (but, by default, the DB will be migrated to latest and seeded with production data)
- ```docker-compose run backend knex migrate:latest``` will migrate to the latest db
- ```docker-compose run backend knex seed:run``` will seed/re-seed the production environment with essential data. It will NOT delete data from the DB instance
- ```docker-compose run backend knex seed:run --env=reset``` will delete everything in the db
    
## Notes for developers
- The front-end app is designed to be written with ES2015 using AngularJS 1.5+, compiled by webpack. [This page](http://angular-tips.com/blog/2015/06/using-angular-1-dot-x-with-es6-and-webpack/) does a really great job of outlining when to use (and not use) classes.
- Injection/annotation is handled by the ngAnnotatePlugin.
- Both dev environments (backend and client) are started from their root directories using ```npm run start:dev```
- ```.env``` file needed for backend and client

## Demo Flow
1. In the folder /seeds/production, the file ```1_production.js``` lists the initial production seeding of the database. The site uses Google Sign-On (and eventually more... but right now just Google), so you'll want to seed the database with your own google email address (or addresses) to validate a variety of scenarios. That file identifies the following (where you are advised to change the values of the email addresses to see how the site responds to these four distinct levels of security)
    - Awesome Superuser (id:2, email: richard.plotkin@toptal.com)
    - Site Admin (id:3, email: richardjplotkin@gmail.com)
    - Account Admin (id:4, email: richard@richardplotkin.com)
    - Account Analyst (id:5, email:emilykplotkin@gmail.com)
2. From the project root, run ```docker-compose up```
3. Internally, ```docker-compose``` will have created
    - a database at :5432
    - a server at :3000
    - a client at :8080
4. Externally, the client is exposed at :8080, so after your app is running, go [here](http://localhost:8080/).
5. Sign in with your superuser email to have full access to the site
6. After signing in, across the top of the app you will see HOME, ACCOUNTS, and USERS, along with a "Log Out" link.
7. USERS is only available to a superuser. It will display a list of existing users, and allow an admin to create a new user without tying that user to a specific account. This is useful for assigning multiple email addresses to the same user.
8. ACCOUNTS is available to a superuser, site admin, and account admin (limited). With a seeded production database, only users are created by default. So it is up to a superuser or site admin to create a new account. At this time, go ahead and **Create an account**
9. After creating an account, click the account name to view/edit its details. In this interface, you will usually see a list of users, and have the ability to invite additional users (by email address) to the account. At this time, go ahead and **Invite a user** using an email address that you own.
10. Follow the link in the email you will receive, and accept the invitation.
11. When you return to ACCOUNTS > EDIT ACCOUNT, you will see the user listed.
12. Log out, and sign in as the new user. Depending on the permissions granted, as well as the isSuperuser and isSiteAdmin flags previously set on that user account, the user may be able to access the admin interface.
