'use strict';

var Class = require('../models/class');

module.exports = function(app, appSecret, mongoose) {
  var jwtAuth = require('../lib/jwt-auth')(appSecret);
  var formParser = require('../lib/form-parser')(mongoose.connection.db, mongoose.mongo);
  // var permissions = require('../lib/class-permissions')(mongoose.connection.db, mongoose.mongo);
  // var updateObject = require('../lib/update-obj');

  //add a class
  app.post('/api/classes', jwtAuth, formParser, function(req, res) {
    var newClass = new Class();
    newClass.title = req.body.title;
    newClass.descrip = req.body.descrip;
    newClass.date = new Date();
    newClass.createdBy = req.user._id;
    newClass.save(function(err, data) {
      if (err) return res.status(500).send('failed to create class');
      res.json(data);
    });
  });

  //find all classes
  app.get('/api/classes/all', jwtAuth, formParser, function(req, res) {
    Class.find({}, function( err, data ) {
      res.json(data);
    });
  });

  //delete a class
  // app.delete('/api/classes/:classId', jwtAuth, formParser, permissions, function(req, res) {
  //   if (req.class) {
  //     req.class.delete(function(err, data) {
  //       if (err) return res.status(500).send('error deleting class');
  //       return res.json(data);
  //     });
  //   }
  // });

  // update a particular class
  // app.put('/api/classes/single/:classId',
  //   jwtAuth,
  //   permissions,
  //   formParser,
  //   updateObject,
  // function(req, res) {
  //   req.class.update(req.updateObj, function(err, numAffected) {
  //     if (err) return res.status(500).send('update not successful');
  //     return res.json(numAffected);
  //   });
  // });


};
