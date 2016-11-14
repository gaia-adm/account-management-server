'use strict';

const _ = require('lodash');
const AccountInvitations = require('../models/accountInvitations');
const config = require('config');
const CONSTANTS = require('../config/constants');
const db = require('../models/database');
const ERRORS = require('./errors');
const express = require('express');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const passport = require('passport');
const Promise = require('bluebird');
const router = express.Router();
const User = require('../models/users');
const UserEmail = require('../models/userEmails');
const UserAccountRole = require('../models/userAccountRoles');

/***** PASSPORT *****/
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

  return assignAccountRoles;
};

passport.use('google-invitation', new GoogleStrategy({
    clientID: config.get('authentication.googleStrategy.clientId'),
    clientSecret: config.get('authentication.googleStrategy.clientSecret'),
    callbackURL: config.get('authentication.googleStrategy.invitationCallbackURL'),
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, next) {
    validateInvitation(req, accessToken, refreshToken, profile, next)
      .then(function (result) {
        console.info('invitation validated');
        return next(null, result);
      })
      .catch(function (error) {
        console.info('invitation not validated');
        if (_.isString(error)) {
          var e = new Error(error);
          e.status = 400;
          return next(e);
        }
        return next(error);
      })
  })
);

/* Single Invitation */
router.param('invitation_uuid', function(req, res, next, invitation_uuid) {
  AccountInvitations
    .where({uuid: req.params.invitation_uuid})
    .fetch()
    .then(function(invitation) {
      if(!invitation) {
        return next(ERRORS.INVITATION_DOES_NOT_EXIST);
      }
      req.invitation = invitation;
      next();
    }).catch(function() {
      return next(new Error('Could not retrieve invitation'));
    });
});

router.route('/return.google')
  .get(
    passport.authenticate('google-invitation', {
      session: false,
      failureRedirect: '/login',
      passReqToCallback: true,
    }),
    function(err, req, res, next) {
      if(err) {
        let message = err;
        let status  = err.status;
        return res.render('invitation-validation', {message, status});
      }
    },
    function(req, res) {
      return res.render('invitation-validation', {
        message: 'Invitation successfully accepted',
        status: 200}
      );
    }
  );

router.route('/:invitation_uuid')
  .get(
    function(req, res, next) {
      let invitation = _.pick(req.invitation.serialize(), ['uuid', 'email']);
      return res.status(200).json(invitation);
    }
  )
  .delete(
    passport.authenticate('jwt', { failWithError: true, session: false }),
    function(req, res, next) {
      return AccountInvitations
        .where({uuid: req.params.invitation_uuid})
        .destroy()
        .then(function(user) {
          res.json({'message': 'Invitation successfully revoked'});
        }).catch(function(err) {
          next(err);
        })
    }
  );

exports.router = router;
exports.validateInvitation = validateInvitation;

