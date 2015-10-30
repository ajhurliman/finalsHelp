'use strict';

var BasicStrategy = require('passport-http').BasicStrategy;
var User = require('../models/user');

module.exports = function(passport) {
  var verify = function(email, password, done) {
    var lowercaseEmail = email.toLowerCase();
    User.findOne({'basic.email': lowercaseEmail}, function(err, user) {
      if (err) return done('Server error');
      if (!user) return done('User does not exist');
      if (!user.validatePassword(password)) return done('Access denied');
      return done(null, user);
    });
  };

  passport.use(new BasicStrategy(verify));
};
