'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const Promise = require('bluebird');
const validator = require('validator');
const _ = require('lodash');
const db = require('../models/database');
const User = require('../models/users');
const UserEmail = require('../models/userEmails');
const ERRORS = require('./errors');
const UsersDAO = require('../middleware/dao_users');

const isSuperuser = function (req, res, next) {
    if (!req.userIs('superuser')) {
        return next(ERRORS.NOT_AUTHORIZED);
    }
    next();
};
const convertSelfToId = function (req, res, next) {
    if (req.params.id === 'self') {
        req.params.id = req.user.id;
    }
    next();
};
const isSuperuserOrSelf = function (req, res, next) {
    if (!req.userIs('superuser') && !req.userIs('self')) {
        return next(ERRORS.NOT_AUTHORIZED);
    }
    next();
};
const userEmailAggregation = function (qb) {
    qb.column([
        'user_id',
        db.knex.raw('array_agg(email) AS emails')
    ]);
    qb.innerJoin('users', 'xref_user_emails.user_id', 'users.id');
    qb.groupBy('user_id');
    qb.return('emails');
};
const prepUserForResponse = function (user) {
    user.emails = (user.emails.length > 0) ? user.emails[0].emails : [];
    return user;
};

/* GET users listing. */
router.route('/')
    .get(
        passport.authenticate('jwt', {failWithError: true, session: false}),
        isSuperuser,
        function (req, res, next) {
            UsersDAO.getAllUsers()
                .then(function (users) {
                    users = users.serialize().map(prepUserForResponse);
                    res.json(users);
                })
        }
    )

    /* Add a user */
    .post(
        passport.authenticate('jwt', {failWithError: true, session: false}),
        isSuperuser,
        function (req, res, next) {
            let params = _.pick(req.body, ['firstName', 'lastName', 'emails']);
            let hasErrors = false;
            params.emails.forEach(function (email) {
                if (!validator.isEmail(email)) {
                    hasErrors = true;
                    return next(ERRORS.INVITATION_INVALID_EMAIL);
                }
            });
            if (hasErrors) return;

            User.createUser(params)
                .then(function (user) {
                    user = user.serialize();
                    user.emails = user.emails.map(email => {
                        return email.email ? email.email : null;
                    });
                    res.json(user);
                })
                .catch(function (err) {
                    console.error('error!');
                    next(err);
                });
        }
    );

router.route('/:id')
    .get(
        passport.authenticate('jwt', {failWithError: true, session: false}),
        convertSelfToId,
        isSuperuserOrSelf,
        function (req, res, next) {
            UsersDAO.getUserById(req.params.id)
                .then(function (user) {
                    //serialize
                    if (!user) {
                        return next(null, false);
                    }
                    user = user.serialize({shallow: false});
                    //Postgre returns array of roles but SQLite returns comma-separated list as a string
                    //We must have it as array in order to display in UI nicely when multiple roles are set for the user
                    if(user.accounts != null && user.accounts.length > 0){
                        for(let i = 0; i < user.accounts.length; i++) {
                            if(typeof user.accounts[i].role_ids === 'string'){
                                user.accounts[i].role_ids = user.accounts[i].role_ids.split(',');
                            }
                            if(typeof user.accounts[i].role_names === 'string'){
                                user.accounts[i].role_names = user.accounts[i].role_names.split(',');
                            }
                        }
                    }
                    user.emails = user.emails.map(obj => obj.email).sort();
                    res.json(user);
                })
                .catch(function (err) {
                    next(err);
                });
//            }
        })
    .put(
        passport.authenticate('jwt', {failWithError: true, session: false}),
        convertSelfToId,
        isSuperuserOrSelf,
        function (req, res, next) {
            let params = _.pick(req.body, ['firstName', 'lastName', 'emails']);
            let emailList = params.emails;
            params.id = req.params.id;

            let userDefinition = {
                firstName: params.firstName,
                lastName: params.lastName
            };
            if (req.userIs('superuser')) {
                //don't flip permissions if they're not explicitly given
                userDefinition.isSuperuser = req.body.isSuperuser || undefined;
                userDefinition.isAdmin = req.body.isAdmin || undefined;
            }

            db.transaction(function (t) {

                let updateUser = new User({id: params.id})
                    .save(userDefinition, {
                        transacting: t,
                        method: 'update',
                        require: true
                    });

                let removeEmails = updateUser.then(function (user) {
                    return UserEmail
                        .query(function (qb) {
                            qb.where('user_id', '=', user.id)
                                .andWhere('email', 'NOT IN', emailList)
                        })
                        .destroy({transacting: t})
                        .then(function () {
                            return Promise.resolve(user);
                        })
                });

                let validateEmails = removeEmails.then(function (user) {
                    return UserEmail.where('email', 'IN', emailList)
                        .fetchAll(null, {transacting: t})
                        .then(function (emails) {
                            emails = emails.serialize();
                            //make sure we don't have somebody else's email address
                            let otherPeoplesEmails = _.filter(emails, function (email) {
                                return Number(email.user_id) !== Number(user.id);
                            });
                            if (otherPeoplesEmails.length > 0) {
                                return Promise.reject(new Error('Cannot assign another user\'s email address to this account'));
                            } else {
                                //remove the results from my list. Don't need to update what's already there
                                emailList = _.difference(emailList, emails.map(function (e) {
                                    return e.email;
                                }));
                                return Promise.resolve(user);
                            }
                        });
                });

                let updateEmails = validateEmails.then(function (user) {
                    return Promise.map(emailList, function (email) {
                        // we are *not* removing emails on this update
                        //Make sure we're not playing the email-stealing game here:
                        return new UserEmail({'email': email}).save({'user_id': user.id}, {
                            method: 'insert',
                            require: true,
                            transacting: t
                        })
                            .then(function (result) {
                                Promise.resolve(result);
                            });
                    }).then(function () {
                        return Promise.resolve(user);
                    });
                });

                return updateEmails;

            }).then(function (user) {
                // console.info("USER", user);
                user.load({'emails': userEmailAggregation}).then(function (user) {
                    res.json(prepUserForResponse(user.serialize()));
                }).catch(function (err) {
                    next(err);
                });
                // res.json(user);
            }).catch(function (err) {
                console.error('error!');
                next(err);
            });
        }
    )

    .delete(
        passport.authenticate('jwt', {failWithError: true, session: false}),
        isSuperuser,
        function (req, res, next) {
            return UsersDAO.deleteUserById(req.params.id)
                .then(function (user) {
                    res.json({'message': 'User successfully deleted'});
                }).catch(function (err) {
                    next(err);
                })
        }
    );

module.exports = router;
