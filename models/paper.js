'use strict';

var mongoose = require('mongoose');

var paperSchema = mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  classId: mongoose.Schema.Types.ObjectId,
  // title: {type: String, required: true},
  // descrip: {type: String, required: true},
  title: {type: String},
  descrip: {type: String},
  date: Date,
  img: { data: Buffer, contentType: String }
});

module.exports = mongoose.model('Paper', paperSchema, 'papers');
