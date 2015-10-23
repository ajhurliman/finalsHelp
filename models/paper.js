'use strict';

var mongoose = require('mongoose');

var paperSchema = mongoose.Schema({
  userId : mongoose.Schema.Types.ObjectId,
  classId: {type: mongoose.Schema.Types.ObjectId},
  title  : {type: String},
  date   : Date,
  period : String,
  type   : String,
  img    : mongoose.Schema.Types.ObjectId
});

paperSchema.index({classId: 1});

module.exports = mongoose.model('Paper', paperSchema, 'papers');
