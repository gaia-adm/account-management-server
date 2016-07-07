'use strict';

const express = require('express');
const router = express.Router();
const User = require('../models/users');
const passport = require('passport');

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
  });

module.exports = router;
