'use strict';

/**
* Pull form data off request object
* Send any images into MongoDB via GridFS
*/

var grid = require('gridfs-stream');
var Busboy = require('busboy');

module.exports = function(db, driver) {
  return function(req, res, next) {

    //will only parse req's that have 'content-type' set to 'multipart/form-data'
    if (!/multipart\/form\-data/.test(req.headers['content-type'])) return next();
    req.body = req.body || {};

    var busboy = new Busboy({ headers: req.headers });
    var noImg = true;

    //image
    busboy.on('file', function(fieldname, file, filename) {
      //implements MongoDB GridFS
      //used for spreading the load of saving images
      var gfs = grid(db, driver);
      var writeStream = gfs.createWriteStream({});
      noImg = false;

      req.body.title = filename;

      writeStream.on('close', function(data) {
        req.body.image = data._id;
        next();
      });

      file.on('data', function(data) {
        writeStream.write(data);
      });
      file.on('end', function() {
        writeStream.end();
      });
    });

    //pull other fields off request
    busboy.on('field', function(fieldname, val) {
      req.body[fieldname] = val;
    });

    busboy.on('finish', function() {
      if (noImg) next();
    });

    req.pipe(busboy);
  };
};
