'use strict';

var jwt = require('jwt-simple');
var User = require('../models/user');

module.exports = function(secret) {
  return function(req, res, next) {
    var token = req.headers.jwt;

    var decoded;
    try {
      decoded = jwt.decode(token, secret);
    } catch (e) {
      return res.status(403).send('decode error');
    }

    User.findById(decoded.sub, function(err, user) {
      if (err) return res.status(500).send('server error');
      if (!user) return res.status(403).send('access denied');
      req.user = user;
      next();
    });
  };
};
