'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const config = require('config');

/* GET users listing. */
router.get('/google',
  passport.authenticate('google', {
    scope: 'profile email'
  }));

router.get('/google/return',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login'
  }),
  function(req, res) {
    let user = req.user;
    let token = jwt.sign({id: user.id}, config.get('secret'), {
      expiresIn: '365d'
    });
    res.json({ success: true, token: 'JWT ' + token });
  });

module.exports = router;
