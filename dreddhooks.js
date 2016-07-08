'use strict';

const hooks = require('hooks');
const jwt = require('jsonwebtoken');
const config = require('config');
const db = require('./models/database');
const User = require('./models/users');
const UserEmail = require('./models/userEmails');
const _ = require('lodash');

let responseStash = {};

const superuserToken = jwt.sign({id: 42}, config.get('secret'), {expiresIn: '1h'});

const supplyAuthToken = function(authorization) {
  let token;
  switch(authorization) {
    case 'Superuser':
      token = 'JWT ' + superuserToken;
      break;
    default:
      token = 'NONE';
      break;
  }
  return token;
};

//before doing any tests, re-seed the database
hooks.beforeAll(function(transactions, done) {
  return db.knex.seed.run({
    directory: './test/seeds'
  }).then(function() {
    done();
  })
});

hooks.beforeEach(function (transaction) {
  if(typeof(transaction.request.headers) === 'object' &&
    transaction.request.headers.Authorization !== undefined) {
    transaction.request.headers.Authorization = supplyAuthToken(transaction.request.headers.Authorization);
  }
});

//Before creating this user, remove any matching emails
hooks.before("Users > User Collection > Create a Single User", function(transaction) {
  let body = JSON.parse(transaction.request.body);
  if(body && body.emails !== undefined) {
    db.knex('xref_user_emails')
      .whereIn('email', body.emails)
      .del()
      .then(function(count) {
        hooks.log('deleted ' + count + ' rows');
      });
  }
});

//Before updating the user, save the pre-update state
hooks.before("Users > User > Update A Single User", function(transaction) {
  let uri = transaction.request.uri;
  let id = uri.replace(/.*\/(\d+)$/,'$1');
  User.where({id: Number(id)}).fetch().then(function(user) {
    responseStash.user = user;
  });
});

//After updating the user, apply the pre-update state
hooks.after("Users > User > Update A Single User", function(transaction, done) {
  let user = _.pick(responseStash.user.attributes, ['id', 'firstName', 'lastName']);
  return new User(user).save()
    .finally(function() {
      done();
    });
});
