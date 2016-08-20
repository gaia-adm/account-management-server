'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const validator = require('validator');
const Promise = require('bluebird');
const _ = require('lodash');
const db = require('../models/database');
const Account = require('../models/accounts');
const UserAccountRole = require('../models/userAccountRoles');
const AccountInvitations = require('../models/accountInvitations');
const ERRORS = require('./errors');
const ip = require('ip');

const sendInvitation = function(req, uuid, recipient) {
  let send = Promise.promisify(req.app.mailer.send, {context: req.app.mailer});
  return send({
    template: 'invitation',
    headers: [{
      'X-Mailgun-Drop-Message': process.env.NODE_ENV==='test'?'yes':''
    }]
  }, {
    to     : recipient, // REQUIRED. This can be a comma delimited string just like a normal email to field.
    subject: 'HPE Account Invitation', // REQUIRED.
    path   : 'http://' + process.env.CLIENT_HOST + ':' + process.env.CLIENT_PORT + '/invitations/' + uuid
  });
};

const userWithRoles = function(qb) {
  qb.column([
    'users.firstName',
    'users.lastName',
    'users.id',
    db.knex.raw('array_agg(roles.id) AS role_ids, array_agg(roles.name) AS role_names')
  ]);
  qb.innerJoin('roles','xref_user_account_roles.role_id','roles.id');
  qb.groupBy('users.id','users.firstName','users.lastName','xref_user_account_roles.user_id','xref_user_account_roles.account_id');
};

const userWithRolesAndEmails = function(qb) {
  qb.column([
    'users.firstName',
    'users.lastName',
    'users.id',
    db.knex.raw('array_agg(roles.id) AS role_ids, array_agg(roles.name) AS role_names, array_agg(xref_user_emails.email) AS emails')
  ]);
  qb.innerJoin('roles','xref_user_account_roles.role_id','roles.id');
  qb.innerJoin('xref_user_emails','xref_user_emails.user_id','users.id');
  qb.groupBy('users.id','users.firstName','users.lastName','xref_user_account_roles.user_id','xref_user_account_roles.account_id');
};

const isSiteAdmin = function(req, res, next) {
  if(!req.userIs('siteAdmin')) {
    return next(ERRORS.NOT_AUTHORIZED);
  }
  next();
};
const isSuperuserOrAdmin = function(req, res, next) {
  if(!req.userIs('superuser') || !req.userIs('account admin')) {
    return next(ERRORS.NOT_AUTHORIZED);
  }
  next();
};
const userIsAccountAdmin = function(user, account) {
  if(!account.users || !_.isArray(account.users)) return false;
  let matchedUser = _.find(account.users, {id: user.id});
  if(matchedUser === null) return false;
  return matchedUser.role_ids.indexOf(1) !== -1;
};

const userCanEditAccountByAccountId = function(user, accountId, next) {
  //fetch the account to check user access
  Account
    .where({id: accountId})
    .fetch({
      withRelated: [{'users':userWithRoles}]
    })
    .then(function(account) {
      //serialize
      if(!account) {
        return next(ERRORS.NOT_AUTHORIZED);
      }
      account = account.serialize({shallow: false});
      if(!userIsAccountAdmin(user, account)) {
        return next(ERRORS.NOT_AUTHORIZED);
      }
      next();
    });
};


/* GET accounts listing. */
router.route('/')
  .get(
    passport.authenticate('jwt', { failWithError: true, session: false }),
    function(req, res, next) {
      let accounts;
      if(req.userIs('siteAdmin')) {
        new Account()
          .orderBy('name')
          .query()
          .then(function (accounts) {
            res.json(accounts);
          })
      } else {
        //if not superuser or site admin, only allow someone with "account admin"=1 level access
        Account
          .query(function(qb) {
            qb.where('xref_user_account_roles.user_id','=',req.user.id)
              .andWhere('xref_user_account_roles.role_id','=',1)
              .innerJoin('xref_user_account_roles','xref_user_account_roles.account_id','accounts.id')
              .groupBy('accounts.id')
              .orderBy('accounts.name')
          })
          .fetchAll()
          .then(function (accounts) {
            res.json(accounts);
          })
      }
    }
  )
  .post(
    passport.authenticate('jwt', { failWithError: true, session: false }),
    isSiteAdmin,
    function (req, res, next) {
      let data = _.pick(req.body, ['name', 'description']);
      Account.forge({
        name: data.name,
        description: data.description
      })
        .save(null, {method: 'insert'})
        .then(function(account) {
          res.json(account);
        })
        .catch(function(err) {
          next(err);
        });
    });

/* Single Account */
router.route('/:id')
  .get(
    passport.authenticate('jwt', { failWithError: true, session: false }),
    function(req, res, next) {
      //fetch the user by id
      Account
        .where({id: req.params.id})
        .fetch({
          withRelated: [{'users':userWithRolesAndEmails}, 'invitations']
        })
        .then(function(account) {
          //serialize
          if(!account) {
            return next(null, false);
          }
          account = account.serialize({shallow: false});

          if(req.userIs('siteAdmin') || userIsAccountAdmin(req.user, account)) {
            res.json(account);
          } else {
            return next(ERRORS.NOT_AUTHORIZED);
          }
        })
        .catch(function(err) {
          next(err);
        });
    })
  .put(
    passport.authenticate('jwt', { failWithError: true, session: false }),
    function(req, res, next) {
      if(req.userIs('siteAdmin')) {
        return next();
      }
      userCanEditAccountByAccountId(req.user, req.params.id, next);
    },
    function(req, res, next) {
      let params = _.pick(req.body, ['name', 'description', 'enabled', 'users']);

      // only allow updates that lack a user object (and don't update users at all), or provides an array of user objects
      if(params.users && (!_.isArray(params.users))) {
        return next(ERRORS.ACCOUNT_UPDATE_REQUIRES_USERS)
      }

      // validate the updating user objects
      let err = null;

      if(params.users) {
        //after passing through this map function, if all users are without roles,
        // then params.users will be an empty array
        params.users = params.users.map(function (user) {
          if ((!user.id && !user.user_id) || (!user.role_id && !user.role_ids)) {
            err = ERRORS.ACCOUNT_UPDATE_USER_DATA_VALIDATION;
          }

          if (user.role_ids) {
            let userRoles = [];
            user.role_ids.forEach(function (role_id) {
              userRoles.push({
                'user_id': (user.id) ? user.id : user.user_id,
                'role_id': role_id
              });
            });
            return userRoles;
          }
          return {
            'user_id': (user.id) ? user.id : user.user_id,
            'role_id': user.role_id
          }
        });
        params.users = _.flatten(params.users);
      } else {
        //if params.users was not provided by the request, set it to this special (useless) value
        params.users = -1;
      }

      if(err) next(err);

      //In this transaction, we delete all account/user pairs and recreate them, unless params.users is unset
      db.transaction(function(t) {
        return new Account({
          id: req.params.id
        })
          .save({
            name        : params.name,
            description : params.description,
            enabled     : params.enabled
          },{
            transacting: t,
            method: 'update',
            require: true
          })
          .tap(function(model) {
            if(params.users === -1) return true;
            return UserAccountRole
              .where({'account_id': model.id})
              .destroy({require: false, transacting: t});
          })
          .tap(function(model) {
            if(params.users === -1) return true;
            return Promise.map(params.users, function(data) {
              return new UserAccountRole(data).save({'account_id': model.id}, {method: 'insert', require: false, transacting: t});
            });
          });
      }).then(function(account) {
        if(!account) {
          return next(null, false);
        }
        account.load([{'users':userWithRoles}]).then(function(account) {
          if(!account) {
            return next(null, false);
          }
          res.json(account);
        }).catch(function(err) {
          next(err);
        })

      }).catch(function(err) {
        next(err);
      });
    }
  )
  .delete(
    passport.authenticate('jwt', { failWithError: true, session: false }),
    isSiteAdmin,
    function(req, res, next) {
      return Account
        .where({id: req.params.id})
        .destroy()
        .then(function(user) {
          res.json({'message': 'Account successfully deleted'});
        }).catch(function(err) {
          next(err);
        })
    }
  );

router.route('/:id/invitations')
  .post(
    passport.authenticate('jwt', { failWithError: true, session: false }),
    function(req, res, next) {
      if(req.userIs('siteAdmin')) {
        return next();
      }
      userCanEditAccountByAccountId(req.user, req.params.id, next);
    },
    function(req, res, next) {
      let params = _.pick(req.body, ['email', 'role_ids']);
      let loadedInvitation;

      params.id = req.params.id;
      if(!validator.isEmail(params.email)) {
        return next(ERRORS.INVITATION_INVALID_EMAIL);
      }
      if(!_.isArray(params.role_ids) || params.role_ids.length === 0) {
        return next(ERRORS.INVITATION_NO_ROLES_PROVIDED);
      }

      //check if the email already represents an account user
      /**
       SELECT xref_user_account_roles.account_id, xref_user_emails.email
       FROM users
       INNER JOIN xref_user_emails ON xref_user_emails.user_id = users.id
       INNER JOIN xref_user_account_roles ON xref_user_account_roles.user_id = users.id
       WHERE xref_user_emails.email = 'richardjplotkin@gmail.com'
       GROUP BY xref_user_account_roles.account_id, users.id, xref_user_emails.email
       **/

      let emailHasAccess = UserAccountRole.query(
        function(qb) {
          qb.column([
            'xref_user_account_roles.account_id',
            'xref_user_emails.email'
          ]);
          qb.innerJoin('users', 'xref_user_account_roles.user_id', 'users.id');
          qb.innerJoin('xref_user_emails', 'xref_user_emails.user_id', 'users.id');
          qb.where('xref_user_emails.email','=',params.email);
          qb.where('xref_user_account_roles.account_id','=',params.id);
        }
      )
        .fetch()
        .then(function(result) {
          // console.info('my result from this thang', result);
          //if there IS a result, that's BAD (in this case)
          if(result !== null) return Promise.reject('User already has access to account.');
        });

      let saveAccount = emailHasAccess.then(function() {
        // console.info('calling saveAccount');
        return AccountInvitations.forge({
          account_id      : params.id,
          email           : params.email,
          invited_role_ids: params.role_ids
        }).save()
          .catch(function(e) {
            if(e.detail.match(/already exists/i)) {
              throw new Error('An invitation already exists for this email address.');
            } else {
              throw e;
            }
          })
      });

      let loadInvitation = saveAccount.then(function(invitation) {
        if(!invitation) return Promise.reject('Invitation not created.');
        return invitation.refresh();
      });

      let invitationSent = loadInvitation.then(function(invitation) {
        if(!invitation) {
          return next(null, false);
        }
        loadedInvitation = invitation;
        return sendInvitation(req, invitation.get('uuid'), invitation.get('email'))
      });

      return invitationSent.then(function(sent) {
        res.status(200).json(loadedInvitation);
      }).catch(function(err) {
        if(_.isString(err)) {
          err = {
            status: 400,
            name: 'ERROR',
            message: err
          }
        }
        if(loadedInvitation) {
          loadedInvitation.destroy().finally(function() {
            return next(err);
          });
        } else {
          return next(err);
        }
      })

    }
  );

module.exports = router;
