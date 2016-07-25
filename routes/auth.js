'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GoogleTokenStrategy = require('passport-google-id-token');
const jwt = require('jsonwebtoken');
const config = require('config');
const db = require('../models/database');
const Promise = require('bluebird');
const UserEmail = require('../models/userEmails');
const User = require('../models/users');
const UserAccountRole = require('../models/userAccountRoles');
const AccountInvitations = require('../models/accountInvitations');
const ERRORS = require('./errors');
const _ = require('lodash');

const CONSTANTS = {
  'INVITATION_NOT_FOUND': 'Invitation not found',
  'INVITATION_ALREADY_ACCEPTED': 'This invitation was already used.',
  'INVITATION_UNMATCHING_EMAIL': 'Invited email address does not match authenticated email address.',
  'USER_NOT_FOUND': 'User not found'
};

const validateUser      = function(req, accessToken, refreshToken, profile, next) {
  console.info('profile', profile);
  if(!profile || !profile.emails) {
    return Promise.reject();
  }
  let emails = profile.emails.map(function(email) {
    return email.value;
  });
  //TODO: if there are multiple emails in the profile, with different user-ids, merge down to a single user-id
  let lookupUserId = UserEmail.query().select('user_id').whereIn('email', emails).groupBy('user_id');
  let user = lookupUserId.then(function(results) {
    if(!results || results.length === 0) return Promise.reject(CONSTANTS.USER_NOT_FOUND);
    if(results.length > 1) {
      console.error('Emails match multiple user IDs');
    }
    let userId = results[0].user_id;
    return User.where({id: userId}).fetch();
  });
  return user;
};

const validateInvitation =  function(req, accessToken, refreshToken, profile, next) {

  //get the id by which to find the invite
  let invitationUuid = req.query.state;
  let invitedEmail, invitedAccount, invitedRoleIDs;

  //look up the invite
  let accountInvitation = AccountInvitations.where('uuid', invitationUuid).fetch();

  //ensure a valid email that matches the invited email
  let validEmail = accountInvitation.then(function(accountInvitation) {

    if(!accountInvitation) {
      return Promise.reject(CONSTANTS.INVITATION_NOT_FOUND);
    }

    if(accountInvitation.get('date_accepted') !== null) {
      return Promise.reject(CONSTANTS.INVITATION_ALREADY_ACCEPTED);
    }

    invitedEmail    = accountInvitation.get('email');
    invitedAccount  = accountInvitation.get('account_id');
    invitedRoleIDs  = accountInvitation.get('invited_role_ids');

    if(!profile || !profile.emails || _.find(profile.emails, {value: invitedEmail}) === undefined) {
      return Promise.reject(CONSTANTS.INVITATION_UNMATCHING_EMAIL);
    }

    return Promise.resolve(invitedEmail);
  });

  let findOrCreateUser = validEmail.then(function(invitedEmail) {
    return UserEmail.where('email', invitedEmail).fetch({withRelated: 'user'})
      .then(function(userEmail) {
        if(!userEmail) return User.createUser({
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          emails: [invitedEmail]
        });
        return Promise.resolve(userEmail.related('user'));
      })
  });

  let assignAccountRoles = findOrCreateUser.then(function(user) {

    return db.transaction(function(trx) {

      //remove from invitedRoleIDs and roles on this account that the user has already accepted
      let removeMatchingRoles = UserAccountRole.query().where({
        account_id: invitedAccount,
        user_id: user.id
      }).then(function(matches) {

        if(matches.length > 0) {
          let roleIDs = matches.map(function(row) {
            return row.role_id;
          });
          invitedRoleIDs = _.difference(invitedRoleIDs, roleIDs);
        }
      });

      let accountRole = removeMatchingRoles.then(function() {
        return Promise.map(invitedRoleIDs, function(roleID) {
          return new UserAccountRole({
            account_id  : invitedAccount,
            role_id     : roleID,
            user_id     : user.id
          }).save(null, {
            method      : 'insert',
            transacting : trx,
            require     : true
          });
        })
      });

      let acceptInvitation = accountRole.then(function() {
        return AccountInvitations.where({'uuid':invitationUuid}).save({date_accepted: db.knex.fn.now()},{transacting: trx, require: true, patch: true});
      });

      return acceptInvitation.then(function(results) {
        if(!results) {
          return Promise.reject('no results');
        }
        return Promise.resolve(user);
      });
    });
  });

  return assignAccountRoles

};

const validationCallback = function(fn, req, accessToken, refreshToken, profile, next) {
  fn(req, accessToken, refreshToken, profile, next)
    .then(function(result) {
      // console.info('result', result);
      return next(null, result);
    })
    .catch(function(error) {
      // console.info('error', error);
      if(_.isString(error)) {
        var e = new Error(error);
        e.status = 400;
        return next(e);
      }
      return next(error);
    });
};

const validateInvitationCallback = function(req, accessToken, refreshToken, profile, next) {
  return validationCallback(validateInvitation, req, accessToken, refreshToken, profile, next);
};

const validateUserCallback = function(req, accessToken, refreshToken, profile, next) {
  return validationCallback(validateUser, req, accessToken, refreshToken, profile, next);
};

const resolveUserJWT = function(req, res) {
  // console.info('resolveUserJWT', req, res);
  let user = req.user;
  let token = jwt.sign({id: user.id}, config.get('secret'), {
    expiresIn: '365d'
  });
  res.cookie('token', token, {
    httpOnly: true
  });
  res.json({ success: true, user: user});
};

passport.use('google-invitation', new GoogleStrategy({
    clientID: config.get('authentication.googleStrategy.clientId'),
    clientSecret: config.get('authentication.googleStrategy.clientSecret'),
    callbackURL: config.get('authentication.googleStrategy.invitationCallbackURL'),
  },
  validateInvitationCallback)
);

//passport setup
passport.use('google', new GoogleStrategy({
    clientID: config.get('authentication.googleStrategy.clientId'),
    clientSecret: config.get('authentication.googleStrategy.clientSecret'),
    callbackURL: config.get('authentication.googleStrategy.callbackURL'),
  },
  validateUserCallback)
);

passport.use('google-id-token', new GoogleTokenStrategy({
    clientID: config.get('authentication.googleStrategy.clientId')
  },
  function(parsedToken, googleId, done) {
    let profile = _.clone(parsedToken.payload);
    profile.emails = [{value: profile.email}];
    profile.displayName = profile.name;
    return validateUserCallback(null, null, null, profile, done);
  })
);

/* GET users listing. */
router.get('/google',
  passport.authenticate('google', {
    scope: 'profile email',
    login_hint: 'richardjplotkin@gmail.com',
    response_type: 'token'
  }));

router.get('/google/invitation/:invitationUuid',
  function(req, res, next) {

    //look up the invitation by its uuid
    AccountInvitations
      .where('uuid', req.params.invitationUuid)
      .fetch()
      .then(function(invitation) {
        if(!invitation) {
          return next(ERRORS.INVITATION_DOES_NOT_EXIST);
        }
        passport.authenticate('google-invitation', {
          scope: 'profile email',
          login_hint: invitation.get('email'),
          state: invitation.get('uuid'),
          response_type: 'token'
        }, function(err, user, info) {
          if (err) { return next(err); }
          if (!user) { return res.redirect('/login'); }
          req.logIn(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/users/' + user.username);
          });
        })(req, res, next);
      })
      .catch(function(err) {
        return next(err);
      });
  });

router.get('/google/return/invitation',
  passport.authenticate('google-invitation', {
    session: false,
    failureRedirect: '/login',
    passReqToCallback: true,
  }), resolveUserJWT);


router.get('/google/return',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login',
    passReqToCallback: true,
  }), resolveUserJWT);

router.post('/google/token',
  passport.authenticate('google-id-token', {
    session: false,
    passReqToCallback: true
  }),
  resolveUserJWT);

exports.router = router;
exports.validateInvitation = validateInvitation;
exports.validateUser = validateUser;
exports.CONSTANTS = CONSTANTS;
