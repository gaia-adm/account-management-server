'use strict';

const _         = require('lodash');
const config    = require('config');
const app       = require('../app');
const request   = require('supertest');
const chai      = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect    = require('chai').expect;
const jwt       = require('jsonwebtoken');
const db        = require('../models/database');
const User      = require('../models/users');
const AccountInvitations = require('../models/accountInvitations');
const authRoutes = require('../routes/auth');
const validateUser = authRoutes.validateUser;
const CONSTANTS = authRoutes.CONSTANTS;

const reseed = function(done) {
  return db.knex.seed.run().then(function() {
    done();
  })
};


describe('Authorization: ', function() {

  before(function(done) {
    reseed(done);
  });

  const seededAccountId = 36;
  const invitedUserEmail = 'richard.plotkin@toptal.com';
  const invitedUserRoles = [2,3];

  const token = jwt.sign({id: 42}, config.get('secret'), {expiresIn: '100h'});

  let emptyFn = function(){};

  let profile = {
    name: {
      familyName: 'TestFamilyName',
      givenName: 'TestGivenName'
    },
    emails: [{
      value: invitedUserEmail
    }]
  };



  describe('Authenticating a user', () => {

    let tempUserEmail = 'my@test.email';
    let tempUserId = 0;

    before(function(done) {
      User.createUser({
        firstName: 'TestFirstName',
        lastName: 'TestLastName',
        emails: [tempUserEmail]
      }).then(function(user) {
        tempUserId = user.id;
        done();
      });
    });

    after(function(done) {
      User.where('id', tempUserId).destroy().then(function() {
        done();
      })
    });

    it('should find an existing user by profile email', () => {
      let tempProfile = _.cloneDeep(profile);
      tempProfile.emails[0].value = tempUserEmail;

      let doValidation = validateUser(null, null, null, tempProfile, emptyFn);
      return expect(doValidation.call('serialize')).to.eventually.include({id: tempUserId});
    });

    it('should not find a user when profile email does not exist', () => {
      let tempProfile = _.cloneDeep(profile);
      tempProfile.emails[0].value = 'not-an-email@not.com';

      let doValidation = validateUser(null, null, null, tempProfile, emptyFn);
      return expect(doValidation).to.eventually.be.rejectedWith(CONSTANTS.USER_NOT_FOUND);
    });
  });

  it('should expire old invitations');

});
