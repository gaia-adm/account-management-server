'use strict';

const _         = require('lodash');
const Promise   = require('bluebird');
const config    = require('config');
const app       = require('../app');
const request   = require('supertest');
const chai      = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect    = require('chai').expect;
const jwt       = require('jsonwebtoken');
const db        = require('../models/database');
const Account   = require('../models/accounts');
const User      = require('../models/users');
const UserEmail = require('../models/userEmails');
const AccountInvitations = require('../models/accountInvitations');
const authRoutes = require('../routes/auth');
const validateInvitation = authRoutes.validateInvitation;
const validateUser = authRoutes.validateUser;
const CONSTANTS = authRoutes.CONSTANTS;

const reseed = function(done) {
  return db.knex.seed.run().then(function() {
    done();
  })
};


describe('Authorization: ', function() {

  before(function(done) {
    return reseed(done);
  });

  const seededAccountId = 36;
  const invitedUserEmail = 'richard.plotkin@toptal.com';
  const invitedUserRoles = [2,3];
  const fixedUuid = '77C150B6-9FB1-4CFB-BEDB-FC3D2098EF82';
  const randomUuid = '456FACD4-CFF4-40B9-87D0-6DDDBA06C9E0';

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

  const createInvitation = function(email, account, roles, uuid) {
    console.info('cccccc');
    return AccountInvitations.forge({
      email: email,
      account_id: account,
      invited_role_ids: roles
    }).save()
      .then(function(i) {
        console.info('iiiii', i);
      }).catch(function(e) {
        console.info('eeeee', e);
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
        .set('Cookie', 'token='+token)
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
    let req = {
      query: {
        state: randomUuid
      }
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
      let doValidation = validateInvitation(badRequest, null, null, profile, emptyFn)
      expect(doValidation).to.eventually.be.rejectedWith(CONSTANTS.INVITATION_NOT_FOUND).notify(done);
    });

    it('should fail validation if the request email does not match a profile email', (done) => {
      let badProfile = _.cloneDeep(profile);
      badProfile.emails[0].value = 'wrong-email@not-found.com';
      let doValidation = validateInvitation(req, null, null, badProfile, emptyFn);
      expect(doValidation).to.eventually.be.rejectedWith(CONSTANTS.INVITATION_UNMATCHING_EMAIL).notify(done);
    });

    it('should create a user if the invited email does not match a user', () => {
      let unacceptInvitation = invitation.save({date_accepted: null},{patch:true});

      let initialUserCount = 0;
      let userCount = unacceptInvitation.then(function() {
        return User.count().then(function(count) {
          initialUserCount = Number(count);
          return initialUserCount;
        });
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

    it('should fail validation if the invitation was already accepted', (done) => {
      let doValidation = validateInvitation(req, null, null, profile, emptyFn);
      expect(doValidation).to.eventually.be.rejectedWith(CONSTANTS.INVITATION_ALREADY_ACCEPTED).notify(done);
    });

    it('should find an existing user (and not create one) if the invited email matches that user', () => {
      let unacceptInvitation = invitation.save({date_accepted: null},{patch:true});

      let initialUserCount = 0;
      let userCount = unacceptInvitation.then(function() {
        return User.count().then(function(count) {
          initialUserCount = Number(count);
          return initialUserCount;
        });
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

  });

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
