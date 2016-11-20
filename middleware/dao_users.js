'use strict';

const validator = require('validator');
const db = require('../models/database');
const User = require('../models/users');
const UserEmail = require('../models/userEmails');

const userEmailAggregation = function (qb) {
    if (db.knex.client.config.client == 'sqlite3') {
        qb.column([
            'user_id',
            db.knex.raw('group_concat(email) AS emails')
        ]);
    }
    else {
        qb.column([
            'user_id',
            db.knex.raw('array_agg(email) AS emails')
        ]);
    }
    qb.innerJoin('users', 'xref_user_emails.user_id', 'users.id');
    qb.groupBy('user_id');
    qb.return('emails');
};

function getUserById(userId) {
    if (db.knex.client.config.client == 'sqlite3') {
        console.warn('Working with SQLITE !!!');
        //fetch the user by id
        return User.where({id: userId})
            .fetch({
                withRelated: [
                    'emails',
                    {
                        'accounts': function (qb) {
                            qb.column([
                                'account_id',
                                'accounts.name',
                                db.knex.raw('group_concat(roles.id) AS role_ids, group_concat(roles.name) AS role_names')
                            ]);
                            qb.innerJoin('roles', 'xref_user_account_roles.role_id', 'roles.id');
                            qb.groupBy('accounts.name', 'xref_user_account_roles.user_id', 'xref_user_account_roles.account_id');
                        }
                    }
                ]
            })
    } else {
        return User.where({id: userId})
            .fetch({
                withRelated: [
                    'emails',
                    {
                        'accounts': function (qb) {
                            qb.column([
                                'account_id',
                                'accounts.name',
                                db.knex.raw('array_agg(roles.id) AS role_ids, array_agg(roles.name) AS role_names')
                            ]);
                            qb.innerJoin('roles', 'xref_user_account_roles.role_id', 'roles.id');
                            qb.groupBy('accounts.name', 'xref_user_account_roles.user_id', 'xref_user_account_roles.account_id');
                        }
                    }
                ]
            })
    }
};

function getAllUsers() {
    return User.fetchAll({withRelated: [{'emails': userEmailAggregation}]});
};

function deleteUserById(userId) {
    return User.where({id: userId}).destroy()
}


exports.getUserById = getUserById;
exports.getAllUsers = getAllUsers;
exports.deleteUserById = deleteUserById;
exports.userEmailAggregation = userEmailAggregation;