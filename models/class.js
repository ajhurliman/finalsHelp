'use strict';

var mongoose = require('mongoose');

var classSchema = mongoose.Schema({
  title: {type: String},
  descrip: {type: String},
  date: Date,
  createdBy: mongoose.Schema.Types.ObjectId
});

module.exports = mongoose.model('Class', classSchema, 'classes');
