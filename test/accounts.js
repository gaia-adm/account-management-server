'use strict';

const config    = require('config');
const app       = require('../app');
const request   = require('supertest');
const assert    = require('chai').assert;
const _         = require('lodash');
const Account   = require('../models/accounts');
const ROUTE_ERRORS = require('../routes/errors');

describe('Error conditions on /accounts', function() {

  let accountData = {
    name: 'Dummy Account',
    description: 'Dummy Description'
  };

  beforeEach(function(done) {
    Account.where('name', accountData.name).destroy()
      .then(function() {
        done();
      });
  });

  describe('Account Collection [GET]', ()=> {
    it('should fail with a duplicate account name', function(done) {
      request(app)
        .post('/api/accounts')
        .send(accountData)
        .expect(200)
        .end(function(err, res) {
          request(app)
            .post('/api/accounts')
            .send(accountData)
            .expect(400)
            .end(done);
        });
    });
  });

  describe('Account Update [PUT]', ()=> {
    it('Should fail an update with a non-array assigned to users', function(done) {
      let data = _.clone(accountData);
      data.users = {};
      request(app)
        .put('/api/accounts/37')
        .send(data)
        .expect(ROUTE_ERRORS.ACCOUNT_UPDATE_REQUIRES_USERS.status)
        .end(function(err, res) {
          assert.equal(res.body.message, ROUTE_ERRORS.ACCOUNT_UPDATE_REQUIRES_USERS.message);
          done();
        });
    });
    it('Should fail an update with an empty users array', function(done) {
      let data = _.clone(accountData);
      data.users = [];
      request(app)
        .put('/api/accounts/37')
        .send(data)
        .expect(ROUTE_ERRORS.ACCOUNT_UPDATE_REQUIRES_USERS.status)
        .end(function(err, res) {
          assert.equal(res.body.message, ROUTE_ERRORS.ACCOUNT_UPDATE_REQUIRES_USERS.message);
          done();
        });
    });
  });

});
