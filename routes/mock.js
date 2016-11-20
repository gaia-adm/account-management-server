'use strict';

require('dotenv').load({silent: true});

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
const CONSTANTS = require('../config/constants');


const token = jwt.sign({id: process.env.mockuserid}, config.get('secret'), {expiresIn: '100h'});

router.get('/', function (req, res) {
    if (db.knex.client.config.client == 'sqlite3') {
        if (process.env.mockuserid) {
            if (process.argv.toString().indexOf('env=mock')) {
                return res.status(201).send(jwt.sign({id: process.env.mockuserid}, config.get('secret'), {expiresIn: '100h'}));
            }
        }
    }
    return res.status(414).send();
});

module.exports = router;