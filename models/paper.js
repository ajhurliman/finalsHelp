'use strict';

var mongoose = require('mongoose');

var paperSchema = mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  classId: {type: mongoose.Schema.Types.ObjectId, index: true},
  title: {type: String},
  date: Date,
  period: String,
  type: String,
  img: { data: Buffer, contentType: String }
}, {autoIndex: false});

module.exports = mongoose.model('Paper', paperSchema, 'papers');
