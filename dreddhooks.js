'use strict';
require('dotenv').load({silent: true});
const hooks = require('hooks');
const jwt = require('jsonwebtoken');
const config = require('config');
const db = require('./models/database');
const User = require('./models/users');
const UserEmail = require('./models/userEmails');
const _ = require('lodash');

let responseStash = {};

const superuserToken = jwt.sign({id: 42}, config.get('secret'), {expiresIn: '100h'});
const userToken = jwt.sign({id: 1010}, config.get('secret'), {expiresIn: '100h'});

const supplyAuthToken = function(authorization) {
  // hooks.log('getting token for ' + authorization);
  let token;
  switch(authorization) {
    case 'Superuser':
      token = superuserToken;
      break;
    case 'User':
      token = userToken;
      break;
    default:
      token = 'NONE';
      break;
  }
  return token;
};

const reseed = function(done) {
  return db.knex.seed.run().then(function() {
    hooks.log('db seeded');
    done();
  })
};

//before doing any tests, re-seed the database
hooks.beforeAll(function(transactions, done) {
  return reseed(done);
});

hooks.beforeEach(function(transaction, done) {
  var name = transaction.name;
  if(name.match(/Accounts > Account > Update A Single Account/) ||
    name.match(/Accounts > Account > List All Accounts/)) {
    return reseed(done);
  } else {
    return done();
  }
});

hooks.afterEach(function(transaction, done) {
  var name = transaction.name;
  if(name.match(/Users > User > Delete a Single User/) ||
    name.match(/Accounts > Account > Delete A Single Account/)) {
    return reseed(done);
  } else {
    return done();
  }
});

hooks.beforeEach(function (transaction) {

  hooks.log(typeof(transaction.request.headers));
  hooks.log(transaction.request.headers.Authorization);

  if(typeof(transaction.request.headers) === 'object' &&
    transaction.request.headers.Authorization !== undefined) {
    transaction.request['headers']['Cookie'] = "token=" + supplyAuthToken(transaction.request.headers.Authorization);
    delete(transaction.request['headers']['Authorization']);
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

/** NOT YET IMPLEMENTED **/
hooks.before("Accounts > Account Users > Add a Single User to an Account", function(transaction) {
  transaction.skip = true;
});
