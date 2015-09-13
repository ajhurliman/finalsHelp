'use strict';

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('jwt-simple');

var userSchema = mongoose.Schema({
  basic: {
    email: {type: String, required: true},
    password: {type: String, required: true}
  }
});

userSchema.methods.validatePassword = function(password) {
  return bcrypt.compareSync(password, this.basic.password);
};

userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.generateToken = function(secret) {
  var _this = this;
  return jwt.encode({
    iss: 'Finals_Solution',
    sub: _this._id
  }, secret);
};

module.exports = mongoose.model('User', userSchema);
