'use strict';

var mongoose = require('mongoose');

var classSchema = mongoose.Schema({
  title: {type: String},
  descrip: {type: String},
  date: {type: Date, index: true},
  createdBy: {type: mongoose.Schema.Types.ObjectId, index: true}
});

module.exports = mongoose.model('Class', classSchema, 'classes');
