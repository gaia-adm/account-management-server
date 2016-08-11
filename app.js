'use strict';
require('dotenv').load({silent: true});

const config = require('config');
const express = require('express');
const mailer = require('express-mailer');
const cors = require('cors');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const ip = require('ip');

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const roles = require('./middleware/roles');

const routes = require('./routes/index');
const auth = require('./routes/auth').router;
const users = require('./routes/users');
const accounts = require('./routes/accounts');
const invitations = require('./routes/invitations');

const User = require('./models/users');

ExtractJwt.fromCookie = function() {
  return function(req) {
    // console.info('req.cookies', req.cookies);
    var token = null;
    if (req && req.cookies)
    {
      token = req.cookies['token'];
    }
    // console.info('my token', token);
    return token;
  }
};

passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromCookie(),
    secretOrKey: config.get('secret'),
    // issuer: 'localhost',
    // audience: 'localhost'
  }, function(jwt_payload, done) {
    // console.info('jwt', jwt_payload);
    User
      .where({id: jwt_payload.id})
      .fetch({withRelated: [{
        'accountRoles': function(qb) {
          qb.innerJoin('roles','xref_user_account_roles.role_id','roles.id');
        }
      }]})
      .then(function(user) {
        // console.info('user authenticated', user.serialize());
        done(null, user.serialize());
      }).catch(function(err) {
        // console.info('jwt auth error', err);
        done(err, null);
      })
  }));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(roles.middleware());

app.use(cors(function(req, callback) {
  let originRegex = new RegExp('^http://(localhost|'+ip.address()+')');
  let options = {
    origin: originRegex,
    methods: 'GET, POST, PUT, DELETE',
    credentials: true,
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept'
  };
  callback(null, options);
}));

//SET UP SMTP MAILER
mailer.extend(app, {
  from: process.env.INVITATION_EMAIL_FROM,
  host: process.env.SMTP_HOST, // hostname
  secureConnection: true, // use SSL
  port: 465, // port for secure SMTP
  transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD
  }
});

app.use('/', routes);
app.use('/auth', auth);
app.use('/api/users', users);
app.use('/api/accounts', accounts);
app.use('/api/invitations', invitations);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// catch duplicate key as bad data
app.use(function(err, req, res, next) {
  if(/duplicate key/.test(err.message)) {
    err.status = 400;
  }
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'test' ||
  app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
      name: err.name,
      message: err.message,
      text: err.toString()
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    name: err.name,
    message: err.message
  });
});


module.exports = app;
