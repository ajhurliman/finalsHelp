'use strict';

/**
* Pull form data off request object
* Send any images into MongoDB via GridFS
*/

var grid = require('gridfs-stream');
var Busboy = require('busboy');

module.exports = function(db, driver) {
  return function(req, res, next) {
    req.on('data', function(d) { console.log('Saw ' + d.length + ' request bytes') })

    //will only parse req's that have 'content-type' set to 'multipart/form-data'
    if (!/multipart\/form\-data/.test(req.headers['content-type'])) return next();
    req.body = req.body || {};

    var busboy = new Busboy({ headers: req.headers });
    var noImg = true;

    //detect errors
    busboy.on('error', function(err){
      console.log(err);
    });

    //image
    busboy.on('file', function(fieldname, file, filename) {
      console.log('on file ************');
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
      console.log('on field**********');
      req.body[fieldname] = val;
    });

    busboy.on('finish', function() {
      console.log('on finish*********');
      if (noImg) next();
    });
    
    req.pipe(busboy);
  };
};
