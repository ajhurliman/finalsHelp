'use strict';

/*
* Purpose: Dynamically build "update" object that will be passed into
* mongoose's Model#findByIdAndUpdate.
* Motivation: When a user updates a story, we do not know ahead of time which
* field the user has updated
* Solution: Pull any fields placed by busboy onto req.body onto new object.
*/

var _ = require('lodash');

module.exports = function(req, res, next) {
  req.updateObj = {};
  _.forEach(req.body, function(val, key) {
    if (key === 'image') {
      req.updateObj.img = val;
      return;
    }
    req.updateObj[key] = val;
  });
  next();
};
