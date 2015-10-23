'use strict';

var BasicStrategy = require('passport-http').BasicStrategy;
var User = require('../models/user');

module.exports = function(passport) {
  var verify = function(userid, password, done) {
    console.log(userid, password);
    User.findOne({'basic.email': userid}, function(err, user) {
      if (err) return done('Server error');
      if (!user) return done('User does not exist');
      if (!user.validatePassword(password)) return done('Access denied');
      return done(null, user);
    });
  };

  passport.use(new BasicStrategy(verify));
};
