'use strict';

var Token = require('../models/token');

module.exports = function(app, mongoose) {

  app.post('/api/makeToken', function( req, res ) {
    console.dir(req.body);
    var newToken = new Token();
    newToken.index = req.body.index;
    newToken.code = req.body.code;

    newToken.save(function( err, data ) {
      if (err) return res.status(500).send('error saving token: ', req.index, req.code );
      res.json(data);
    });
  });
};