'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const Promise = require('bluebird');
const _ = require('lodash');
const db = require('../models/database');
const Account = require('../models/accounts');
const UserAccountRole = require('../models/userAccountRoles');
const ERRORS = require('./errors');

/* GET accounts listing. */
router.route('/')
  .get(
    function(req, res, next) {
      Account
        .fetchAll()
        .then(function(accounts) {
          res.json(accounts);
        })
    }
  )
  .post(function (req, res, next) {
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
    function(req, res, next) {
      //fetch the user by id
      Account
        .where({id: req.params.id})
        .fetch({
          withRelated: ['users']
        })
        .then(function(account) {
          //serialize
          if(!account) {
            return next(null, false);
          }
          account = account.serialize({shallow:false});
          res.json(account);
        })
        .catch(function(err) {
          next(err);
        });
    })
  .put(
    function(req, res, next) {
      //fetch the user by id
      let params = _.pick(req.body, ['name', 'description', 'users']);

      // only allow updates that lack a user object (and don't update users at all), or provides an array of user objects
      if(params.users && (!_.isArray(params.users) ||  params.users.length === 0)) {
        return next(ERRORS.ACCOUNT_UPDATE_REQUIRES_USERS)
      }
      if(!params.users) params.users = [];

      // validate the updating user objects
      let err = null;
      params.users = params.users.map(function(user) {
        if((!user.id && !user.user_id) || !user.role_id) {
          err = ERRORS.ACCOUNT_UPDATE_USER_DATA_VALIDATION;
        }
        return {
          'user_id': (user.id) ? user.id : user.user_id,
          'role_id': user.role_id
        }
      });
      if(err) next(err);


      //In this transaction, we delete all account/user pairs and recreate them, unless params.users is unset
      db.transaction(function(t) {
        return new Account({
          id: req.params.id
        })
        .save({
          name        : params.name,
          description : params.description
        },{
          transacting: t,
          method: 'update',
          require: true
        })
        .tap(function(model) {
          if(params.users.length === 0) return true;
          return UserAccountRole
            .where({'account_id': model.id})
            .destroy({require: false, transacting: t});
        })
        .tap(function(model) {
          if(params.users.length === 0) return true;
          return Promise.map(params.users, function(data) {
            return new UserAccountRole(data).save({'account_id': model.id}, {method: 'insert', require: false, transacting: t});
          });
        });
      }).then(function(user) {
        res.json(user);
      }).catch(function(err) {
        next(err);
      });
    }
  )
  .delete(function(req, res, next) {
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

module.exports = router;
