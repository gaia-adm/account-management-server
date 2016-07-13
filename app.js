'use strict';

var config = require('config');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var passport = require('passport');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;

var routes = require('./routes/index');
var auth = require('./routes/auth').router;
var users = require('./routes/users');
var accounts = require('./routes/accounts');

var User = require('./models/users');



passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeader(),
    secretOrKey: config.get('secret'),
    // issuer: 'localhost',
    // audience: 'localhost'
  }, function(jwt_payload, done) {
    console.info('jwt', jwt_payload);
    User
      .where({id: jwt_payload.id})
      .fetch()
      .then(function(user) {
      done(null, user);
    }).catch(function(err) {
      done(err, null);
    })
  }));

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

app.use('/', routes);
app.use('/auth', auth);
app.use('/api/users', users);
app.use('/api/accounts', accounts);

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
