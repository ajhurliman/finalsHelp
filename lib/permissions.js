'use strict';

/*
* Make sure a user has permissions to modify the paper
*
*/

var Paper = require('../models/paper');

module.exports = function(req, res, next) {
  if (req.params) {
    Paper.findById(req.params.paperId, function(err, paper) {
      if (err) return res.status(500).send('paper not found');
      if (String(paper.userId) !== String(req.user._id)) return res.status(403).send('not authorized');
      req.paper = paper;
      next();
    });
  } else {
    next();
  }
};
