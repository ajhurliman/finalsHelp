'use strict';

var User = require('../models/user');

module.exports = function(app, appSecret, passport, mongoose) {
  var formParser = require('../lib/form-parser')(mongoose.connection.db, mongoose.mongo);

  //add user
  app.post('/api/users', function(req, res) {
    console.log(req.body);

    User.findOne({'basic.email': req.body.email}, function(err, user) {
      if (err) return res.status(500).send('server error');
      if (user) return res.status(500).send('cannot create that user');
      if (req.body.password !== req.body.passwordConfirm) return res.status(500).send('passwords do not match');

      var newUser = new User();

      newUser.basic.email = req.body.email;
      newUser.basic.password = newUser.generateHash(req.body.password);
      newUser.name = req.body.name;
      newUser.phone = req.body.phone;

      // console.dir(newUser.basic);

      newUser.save(function(err) {
        if (err) return res.status(500).send('server error');
        res.json({jwt: newUser.generateToken(appSecret)});
      });

    });
  });

  //sign user in
  app.get('/api/users', passport.authenticate('basic', {session: false}), function(req, res) {
    return res.json({jwt: req.user.generateToken(appSecret)});
  });

};
