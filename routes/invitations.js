'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const validator = require('validator');
const Promise = require('bluebird');
const _ = require('lodash');
const db = require('../models/database');
const AccountInvitations = require('../models/accountInvitations');
const ERRORS = require('./errors');

/* Single Invitation */
router.route('/:uuid')
  .delete(function(req, res, next) {
    return AccountInvitations
      .where({uuid: req.params.uuid})
      .destroy()
      .then(function(user) {
        res.json({'message': 'Invitation successfully revoked'});
      }).catch(function(err) {
        next(err);
      })
    }
  );

module.exports = router;
