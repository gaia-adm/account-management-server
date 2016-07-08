'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const Promise = require('bluebird');
const _ = require('lodash');
const database = require('../models/database');
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
    let params = _.pick(req.body, ['firstName', 'lastName', 'emails']);
    params.emails = _.map(params.emails, function(email) {
      return {'email': email};
    });
    database.transaction(function(t) {
      return new User({
        firstName: params.firstName,
        lastName: params.lastName
      })
      .save(null, {transacting: t, method: 'insert'})
      .tap(function(model) {
        return Promise.map(params.emails, function(data) {
          //NOTE: must _explicitly_ set method to insert to get a duplicate key violation
          return new UserEmail(data).save({'user_id': model.id}, {method: 'insert', transacting: t});
        });
      });
    }).then(function(user) {
      res.json(user);
    }).catch(function(err) {
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
        withRelated: ['emails']
      })
      .then(function(user) {
        //serialize
        user = user.serialize({shallow:false});
        user.emails = user.emails.map(obj => obj.email).sort();
        res.json(user);
      });
  })
  .put(function(req, res, next) {
    let params = _.pick(req.body, ['firstName', 'lastName', 'emails']);
    params.id = req.params.id;
    params.emails = _.map(params.emails, function(email) {
      return {'email': email};
    });

    database.transaction(function(t) {
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
