'use strict';

var mongoose = require('mongoose');

var tokenSchema = mongoose.Schema({
  index: Number,
  code: String,
  issued: Date,
  redeemed: Date
});

module.exports = mongoose.model('Token', tokenSchema, 'tokens');