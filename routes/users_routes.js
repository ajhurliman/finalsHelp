'use strict';

var User = require('../models/user');
var Token = require('../models/token');
var nodemailer = require('nodemailer');
var wellknown = require('nodemailer-wellknown');
var path = require('path');

module.exports = function(app, appSecret, passport, mongoose, rootPath) {
  var formParser = require('../lib/form-parser')(mongoose.connection.db, mongoose.mongo);

  //add user
  app.post('/api/users', function(req, res) {
    console.log(req.body);

    //make sure user doesn't already exist
    User.findOne({'basic.email': req.body.email}, function(err, user) {
      if (err) return res.status(500).send('Server error!');
      if (user) return res.status(500).send('Email already registered!');
      if (req.body.password !== req.body.passwordConfirm) return res.status(500).send('Passwords do not match!');

      //validate the token the client is trying to use
      Token.findOne({'code': req.body.token}, function(err, token) {
        if (err) return res.status(500).send('Server error!');
        if (!token) return res.status(500).send('Invalid token!');
        if (token.redeemed) return res.status(500).send('Token already redeemed!');

        var newUser = new User();

        newUser.basic.email = req.body.email;
        newUser.basic.password = newUser.generateHash(req.body.password);
        newUser.name = req.body.name;
        newUser.phone = req.body.phone;
        newUser.confirmed = false;

        //save user to db
        newUser.save(function(err, savedUser) {
          if (err) return res.status(500).send('Error registering user!');

          //send user an email
          // var transporter = nodemailer.createTransport({
          //   service: 'Gmail',
          //   auth: {
          //   }
          // });

          var mailOptions = {
            from: 'Finals Help ✔ <FinalsHelp@gmail.com>',
            to: newUser.basic.email,
            subject: 'Welcome to FinalsHelp.com',
            html: '<p>Hey!</p> <p>Thanks for signing up for FinalsHelp.com, click <a href="http://www.finalshelp.com/api/users/confirm/' + savedUser._id + '">here</a> to confirm your email.</p> <p>Cheers,</p><p>-The FinalsHelp.com team</p>'
          };

          // transporter.sendMail(mailOptions, function(err, data) {
            // if (err) return res.status(500).send(err);
            res.json({jwt: newUser.generateToken(appSecret)});  
          // });
        });

        //redeem token so nobody else can use it
        token.redeemed = new Date().toString();
        token.save(function(err) {
          if (err) console.log('oops! failure saving the redemption of a token!');
        });
      });
    });
  });

  //confirm email
  app.get('/api/users/confirm/:userId', function(req, res) {
    User.findOne({"_id": req.params.userId}, function(err, user) {
      if (!user) return res.status(500).send('user not found');
      user.set('confirmed', true);
      res.status(200).sendFile(rootPath + '/build/uw/assets/thank-you.html');
      // newUser.save(function(err) {
      //   if (err) return res.status(500).send('Oops, there was an issue confirming your account, please send us an email and we\'ll take care of it!');
      //   res.status(200).send('Successful registration!');
      // });
    });
  });

  //sign user in
  app.get('/api/users', passport.authenticate('basic', {session: false}), function(req, res) {
    return res.json({jwt: req.user.generateToken(appSecret)});
  });

};
