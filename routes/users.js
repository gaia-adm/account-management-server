'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const Promise = require('bluebird');
const _ = require('lodash');
const db = require('../models/database');
const User = require('../models/users');
const UserEmail = require('../models/userEmails');

/* GET users listing. */
router.route('/')
  .get(
    passport.authenticate('jwt', { failWithError: true, session: false }),
    function(req, res, next) {
      User
          .fetchAll()
          .then(function(users) {
            res.json(users);
          })
    }
  )

  .post(function (req, res, next) {
    User.createUser(req.body)
      .then(function(user) {
        res.json(user);
      })
      .catch(function(err) {
        console.error('error!');
        next(err);
      });
  });

router.route('/:id')
  .get(
    passport.authenticate('jwt', { failWithError: true, session: false }),
    function(req, res, next) {
    //fetch the user by id
    User
      .where({id: req.params.id})
      .fetch({
        withRelated: [
          'emails',
          {'accounts':
            function(qb) {
              qb.column([
                'account_id',
                'accounts.name',
                db.knex.raw('array_agg(roles.id) AS role_ids, array_agg(roles.name) AS role_names')
              ]);
              qb.innerJoin('roles','xref_user_account_roles.role_id','roles.id');
              qb.groupBy('accounts.name','xref_user_account_roles.user_id','xref_user_account_roles.account_id');
            }
          }
        ]
      })
      .then(function(user) {
        //serialize
        if(!user) {
          return next(null, false);
        }
        user = user.serialize({shallow:false});
        user.emails = user.emails.map(obj => obj.email).sort();
        res.json(user);
      })
      .catch(function(err) {
        next(err);
      });
  })
  .put(function(req, res, next) {
    let params = _.pick(req.body, ['firstName', 'lastName', 'emails']);
    params.id = req.params.id;
    params.emails = _.map(params.emails, function(email) {
      return {'email': email};
    });

    db.transaction(function(t) {
      return new User({
        id: params.id
      })
        .save({
          firstName: params.firstName,
          lastName : params.lastName
        },{
          transacting: t,
          method: 'update',
          require: true
        })
        .tap(function(model) {
          return Promise.map(params.emails, function(data) {
            //NOTE: must _not_ explicitly set method, because we're okay with an insert or an update
            // we are *not* removing emails on this update
            return new UserEmail(data).save({'user_id': model.id}, {require: false, transacting: t});
          });
        });
    }).then(function(user) {
      res.json(user);
    }).catch(function(err) {
      console.error('error!');
      next(err);
    });
  })

  .delete(function(req, res, next) {
    return User
      .where({id: req.params.id})
      .destroy()
      .then(function(user) {
        res.json({'message': 'User successfully deleted'});
      }).catch(function(err) {
        next(err);
      })
  });

module.exports = router;
