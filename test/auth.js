'use strict';

const _         = require('lodash');
const Promise   = require('bluebird');
const config    = require('config');
const app       = require('../app');
const request   = require('supertest');
const chai      = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const assert    = require('chai').assert;
const expect    = require('chai').expect;
const db        = require('../models/database');
const Account   = require('../models/accounts');
const User      = require('../models/users');
const UserEmail = require('../models/userEmails');
const AccountInvitations = require('../models/accountInvitations');
const ROUTE_ERRORS = require('../routes/errors');
const authRoutes = require('../routes/auth');
const validateInvitation = authRoutes.validateInvitation;
const CONSTANTS = authRoutes.CONSTANTS;


describe('Authorization: ', function() {

  const seededAccountId = 36;
  const invitedUserEmail = 'richard.plotkin@toptal.com';
  const invitedUserRoles = [2,3];
  const randomUuid = '456FACD4-CFF4-40B9-87D0-6DDDBA06C9E0';

  const getInvitation = function(email) {
    return AccountInvitations
      .where({email: email})
      .fetch()
      .then(function(invitation) {
        if(!invitation) {
          return null;
        }
        return invitation;
      })
      .catch(function(err) {
        console.error(err);
        return null;
      });
  };

  describe('Inviting a user by email address', () => {

    before((done) => {
      AccountInvitations
        .where({email: invitedUserEmail})
        .destroy()
        .finally(function () {
          done();
        });
    });

    it('should create an account invitation', (done) => {
      request(app)
        .post('/api/accounts/' + seededAccountId + '/invitations')
        .send({
          email   : invitedUserEmail,
          role_ids: invitedUserRoles
        })
        .expect(200)
        .expect(function (res) {
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
  });

  describe('Authenticating an invitation', () => {

    let invitation = null;
    let emptyFn = function(){};
    let req = {
      query: {
        state: randomUuid
      }
    };
    let profile = {
      name: {
        familyName: 'TestFamilyName',
        givenName: 'TestGivenName'
      },
      emails: [{
        value: invitedUserEmail
      }]
    };

    before((next) => {
      UserEmail.where({email: invitedUserEmail}).destroy()
        .then(function() {
          next();
        })
    });

    beforeEach((next) => {
      getInvitation(invitedUserEmail)
        .then(function(i) {
          if(i) {
            invitation = i;
            req.query.state = i.get('uuid');
            i.save({date_accepted: null},{patch:true});
          }
          next();
        })
        .catch(function(e) {
          console.error('e',e);
        });
    });

    it('should fail validation if the invitation uuid is invalid', (done) => {
      let badRequest = _.cloneDeep(req);
      badRequest.query.state = randomUuid;
      expect(
        validateInvitation(badRequest, null, null, profile, emptyFn)
      ).to.eventually.be.rejectedWith(CONSTANTS.INVITATION_NOT_FOUND).notify(done);
    });

    it('should fail validation if the request email does not match a profile email', (done) => {
      let badProfile = _.cloneDeep(profile);
      badProfile.emails[0].value = 'wrong-email@not-found.com';
      expect(
        validateInvitation(req, null, null, badProfile, emptyFn)
      ).to.eventually.be.rejectedWith(CONSTANTS.INVITATION_UNMATCHING_EMAIL).notify(done);
    });

    it('should fail validation if the invitation was already accepted');

    it('should create a user if the invited email does not match a user', () => {
      let initialUserCount = 0;
      let userCount = User.count().then(function(count) {
        initialUserCount = Number(count);
        return initialUserCount;
      });

      let doValidation = userCount.then(function() {
        return validateInvitation(req, null, null, profile, emptyFn)
      });

      let finalUserCount = doValidation.then(function() {
        return User.count().then(function(finalCount) {
          if(Number(finalCount) === initialUserCount+1) {
            return Promise.resolve('User was created.')
          }
          return Promise.reject('A user was not created.');
        });
      });

      return Promise.all([
        expect(doValidation).to.eventually.be.fulfilled,
        expect(finalUserCount).to.eventually.be.fulfilled
      ]);
    });

    it('should find an existing user (and not create one) if the invited email matches that user', () => {
      let initialUserCount = 0;
      let userCount = User.count().then(function(count) {
        initialUserCount = Number(count);
        return initialUserCount;
      });

      let doValidation = userCount.then(function() {
        return validateInvitation(req, null, null, profile, emptyFn)
      });

      let finalUserCount = doValidation.then(function() {
        return User.count().then(function(finalCount) {
          if(Number(finalCount) > initialUserCount) {
            return Promise.reject('User was created.')
          }
          return Promise.resolve('A user was not created.');
        });
      });

      return Promise.all([
        expect(doValidation).to.eventually.be.fulfilled,
        expect(finalUserCount).to.eventually.be.fulfilled
      ]);
    });

    it.skip('should validate the invitation token with the authorized email', (done) => {
      expect(invitation).is.not.null;

      let req = {
        query: {
          state: invitation.get('uuid')
        }
      };



      validateInvitation(req, null, null, profile, function(err, value) {
        expect(value).to.be.true;
        done();
      });

      // expect(invitation.get('uuid')).to.equal('123456');

      // return getInvitation(invitedUserEmail)
      //   .then(function(invitation) {
      //     if(!invitation) {
      //       done();
      //     }
      //
      //     req.query.state = invitation.get('uuid');
      //
      //     return Promise.all([
      //       expect(req.query.state).to.equal('c4e3af97-2782-4590-94a2-d46e66600e45')
      //     ]);
      //   });
    });

  });
    it('should receive an invitation token back from an auth request');

    it('should find a matching user if the DB entry for the email already exists');
    it('should create a user if the DB entry for the email does not already exist');
  // });

  it('should expire old invitations');

});
