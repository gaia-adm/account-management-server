'use strict';

var config = require('config');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;

var routes = require('./routes/index');
var auth = require('./routes/auth');
var users = require('./routes/users');

var User = require('./models/users');

//passport setup
passport.use(new GoogleStrategy({
    clientID: config.get('authentication.googleStrategy.clientId'),
    clientSecret: config.get('authentication.googleStrategy.clientSecret'),
    callbackURL: config.get('authentication.googleStrategy.callbackURL')
  },
  function(accessToken, refreshToken, profile, done) {
    //find the user
    User
      .where({
        firstName: profile.name.givenName,
        lastName: profile.name.familyName
      })
      .fetch()
      .then(function(user) {
        //create the user if s/he does not exist
        if(user === null) {
          // console.log('no user found', user);
          new User({
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value
          }).save().then(function(newUser) {
            return done(null, newUser);
          });
        } else {
          // console.log('user found', user);
          return done(null, user);
        }
      })
      .catch(function() {
        return done(null, false);
      });
  }
));

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

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
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
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
