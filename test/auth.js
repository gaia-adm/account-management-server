'use strict';

const config    = require('config');
const app       = require('../app');
const request   = require('supertest');
const assert    = require('chai').assert;
const expect    = require('chai').expect;
const _         = require('lodash');
const Account   = require('../models/accounts');
const AccountInvitations = require('../models/accountInvitations');
const ROUTE_ERRORS = require('../routes/errors');

describe('Authorization: ', function() {

  const seededAccountId = 36;
  const invitedUserEmail = 'richard.plotkin@toptal.com';
  const invitedUserRoles = [2,3];

  describe('Inviting a user by email address', () => {

    before((done) => {
      AccountInvitations
        .where({email: invitedUserEmail})
        .destroy()
        .finally(function() {
          done();
        });
    });

    it('should create an account invitation', (done) => {
      request(app)
        .post('/api/accounts/'+seededAccountId+'/invitations')
        .send({
          email: invitedUserEmail,
          role_ids: invitedUserRoles
        })
        .expect(200)
        .expect(function(res) {
          // expect(res.body.id).to.be.an.instanceOf(Number);
          // console.log('res.body', res.body);
        })
        .end(done);
    });
    it('should fail to create an invitation if no email is provided');
    it('should fail to create an invitation if an invalid email address is provided');
    it('should fail to create an invitation if no role_ids are provided');
    it('should fail to create an invitation if an invalid role_id is provided');
    it('should have: {' +
      'token,' +
      'email address,' +
      'account_id,' +
      'date_created' +
      '} in the invitation');
    it('should receive an invitation token back from an auth request');
    it('should validate the invitation token with the authorized email');
    it('should find a matching user if the DB entry for the email already exists');
    it('should create a user if the DB entry for the email does not already exist');
  });

  it('should expire old invitations');

});
