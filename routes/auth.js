'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
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
  'INVITATION_UNMATCHING_EMAIL': 'Invited email address does not match authenticated email address.'
};

//passport setup
passport.use('google', new GoogleStrategy({
    clientID: config.get('authentication.googleStrategy.clientId'),
    clientSecret: config.get('authentication.googleStrategy.clientSecret'),
    callbackURL: config.get('authentication.googleStrategy.callbackURL'),
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, next) {
    //get the id by which to find the invite
    let invitationUuid = req.query.state;

    //look up the invite
    AccountInvitations
      .where('uuid',invitationUuid)
      .fetch()
      .then(function(invitation) {
        if(!invitation) {
          return next('error');
        }
        let invitedEmail = invitation.get('email');
      })
      .catch(function(err) {
        return next(err);
      });


    User
      .where({
        firstName: profile.name.givenName,
        lastName: profile.name.familyName
      })
      .fetch()
      .then(function(user) {
        //create the user if s/he does not exist
        if(user === null) {
          console.log('no user found', user);
          User.createUser({
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value
          })
            .then(function(newUser) {
              return done(null, newUser);
            })
            .catch(function(err) {
              return done(null, false);
            })
        } else {
          // console.log('user found', user);
          return done(null, user);
        }
      })
      .catch(function() {
        return done(null, false);
      });
  })
);

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
    console.info('user', user.id, user.get('firstName'));

    return db.transaction(function(trx) {

      //remove from invitedRoleIDs and roles on this account that the user has already accepted
      let removeMatchingRoles = UserAccountRole.query().where({
        account_id: invitedAccount,
        user_id: user.id
      }).then(function(matches) {

        console.info('matches', matches);

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

      return acceptInvitation;
    });
  });

  return assignAccountRoles;

  // accountInvitation
  //   .then(function(invitation) {
  //     if(!invitation) {
  //       return next('error');
  //     }
  //     let invitedEmail = invitation.get('email');
  //     let invitedAccount = invitation.get('account_id');
  //     let invitedRoleIDs = invitation.get('invited_role_ids');
  //     console.log('invitation',invitation);
  //
  //     //confirm that profile email matches invited email
  //     console.info('profile emails', profile.emails);
  //     if(_.find(profile.emails, {value: invitedEmail}) === undefined) {
  //       return next(ERRORS.INVITATION_UNMATCHING_EMAIL);
  //     }
  //
  //     //find user (if any) who has a matching email
  //     UserEmail
  //       .where('email', invitedEmail)
  //       .fetch()
  //       .then(function(user) {
  //         if(!user) {
  //
  //           //a user needs to be created using the profile data
  //           //Once the user is created, the user should be added to the account with the specified roles
  //           //After all those criteria are met, the invitation should be expired
  //           db.transaction(function(t) {
  //             return User
  //               .forge({
  //                 firstName: profile.name.givenName,
  //                 lastName: profile.name.familyName
  //               })
  //               .save(null, {transacting: t, method: 'insert'})
  //               .tap(user =>
  //                 //NOTE: must _explicitly_ set method to insert to get a duplicate key violation
  //                 user.related('emails').create({
  //                   email: invitedEmail
  //                 }, {method: 'insert', transacting: t})
  //               )
  //               .tap(function(user) {
  //                 console.log('user', user);
  //                 Promise.map(invitedRoleIDs, roleID => user.related('accountRoles').create({
  //                   account_id: invitedAccount,
  //                   role_id   : roleID
  //                 }, {
  //                   method     : 'insert',
  //                   transacting: t
  //                 })
  //                   .then(function(accountRole) {
  //
  //                   })
  //                   .catch(function(err) {
  //                     console.log('err', err);
  //                   }));
  //               })
  //           })
  //         }
  //         //a user does *not* need to be created
  //         //The user should be added to the account with the specified roles
  //         //After that addition, the invitation should be expired
  //         console.info('user exists', user);
  //         return next(null, user);
  //       })
  //       .catch(function(err) {
  //         return next(err);
  //       })
  //   })
  //   .catch(function(err) {
  //     return next(err);
  //   });
};

passport.use('google-invitation', new GoogleStrategy({
    clientID: config.get('authentication.googleStrategy.clientId'),
    clientSecret: config.get('authentication.googleStrategy.clientSecret'),
    callbackURL: config.get('authentication.googleStrategy.invitationCallbackURL'),
    passReqToCallback: true
  },validateInvitation)
);

/* GET users listing. */
router.get('/google',
  passport.authenticate('google', {
    scope: 'profile email',
    login_hint: 'richardjplotkin@gmail.com',
    state: 'MY_INVITATION_ID',
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
  }),
  function(req, res) {
    let user = req.user;
    let token = jwt.sign({id: user.id}, config.get('secret'), {
      expiresIn: '365d'
    });
    res.json({ success: true, token: 'JWT ' + token });
  }
);


// router.get('/google/return',
//   passport.authenticate('google', {
//     session: false,
//     failureRedirect: '/login',
//     passReqToCallback: true,
//   }),
//   function(req, res) {
//     let user = req.user;
//     let token = jwt.sign({id: user.id}, config.get('secret'), {
//       expiresIn: '365d'
//     });
//     res.json({ success: true, token: 'JWT ' + token });
//   });

exports.router = router;
exports.validateInvitation = validateInvitation;
exports.CONSTANTS = CONSTANTS;
