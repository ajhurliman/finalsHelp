'use strict';

/*
* Make sure a user has permissions to modify the paper
*
*/

var Class = require('../models/class');

module.exports = function(req, res, next) {
  if (req.params) {
    Class.findById(req.params.classId, function(err, deleteClass) {
      if (err) return res.status(500).send('class not found');
      if (String(deleteClass.createdBy) !== String(req.user._id)) return res.status(403).send('not authorized');
      req.class = deleteClass;
      next();
    });
  } else {
    next();
  }
};
