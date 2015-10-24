'use strict';

var grid = require('gridfs-stream');
var Paper = require('../models/paper');
var updateObject = require('../lib/update-obj');


var fs = require('node-fs');


module.exports = function(app, appSecret, mongoose) {
  var jwtAuth = require('../lib/jwt-auth')(appSecret);
  var permissions = require('../lib/permissions');
  var formParser = require('../lib/form-parser')(mongoose.connection.db, mongoose.mongo);
  var removeImage = require('../lib/remove-image')(mongoose.connection.db, mongoose.mongo);

  // add a paper
  app.post('/api/papers', jwtAuth, function(req, res) {
    console.log('file');
    req.busboy.on('file', function(fieldname, file, filename) {
      console.log('on file ************');
      var gfs = grid(mongoose.connection.db, mongoose.mongo);
      var writeStream = gfs.createWriteStream({});


      writeStream.on('close', function(data) {
        var newPaper = new Paper();

        newPaper.userId = req.user._id;
        newPaper.img = data._id;
        newPaper.title = filename;
        newPaper.date = new Date();
        
        newPaper.save(function(err, data) {
          if (err) return res.status(500).send('error saving paper');
          return res.json(data);
        });
      });

      file.on('data', function(data) {
        writeStream.write(data);
      });

      file.on('end', function() {
        writeStream.end();
      });
    });

    req.busboy.on('field', function(key, value, keyTruncated, valueTruncated) {
      console.log('on field ***********');
    });

    req.pipe(req.busboy);

    // old
    // var newPaper = new Paper();
    // newPaper.userId = req.user._id;
    // newPaper.classId = req.body.classId;
    // newPaper.title = req.body.title;
    // newPaper.date = new Date();

    // if (req.body.image) newPaper.img = req.body.image;

    // newPaper.save(function(err, data) {
    //   if (err) return res.status(500).send('error saving paper');
    //   return res.json(data);
    // });
  });

  //get a paper
  // app.get('/api/papers/single/:paperId', function(req, res) {
  //   console.time('findSinglePaper');
  //   Paper.findById(req.params.paperId, function(err, paper) {
  //     if (err) return res.status(500).send('paper not found');
  //     console.timeEnd('findSinglePaper');
  //     return res.json( paper );
  //   });
  // });

  //get a paper's image
  app.get('/api/papers/single/image/:paperId', function(req, res) {
    Paper.findById(req.params.paperId, function(err, paper) {
      if (err) return res.status(500).send('server error');
      if (!paper) return res.status(500).send('paper does not exist');
      var gfs = grid(mongoose.connection.db, mongoose.mongo);
      // streaming from gridfs
      var readstream = gfs.createReadStream({
        _id: paper.img
      });

      //error handling, e.g. file does not exist
      readstream.on('error', function(err) {
        console.log('An error occurred streaming the image!\n', err);
        return res.status(500).send('readstream error');
      });

      readstream.pipe(res);
    });
  });

  //update a particular paper
  app.put('/api/papers/single/:paperId',
    jwtAuth,
    // permissions,
    // formParser,
    // updateObject,
    // removeImage,
  function(req, res) {

    console.log(req.params);

    // var updatedPaper = {
    //   period: req.period,
    //   type: req.type,
    //   classId: req.class,
    //   title: req.title,
    // };

    Paper.findOneAndUpdate({_id: req.params.paperId}, req.body, {'upsert': true, 'new': true}, function(err, paper) {
      console.log('found paper, about to edit:', paper);
      if (err) return res.status(500).send('error finding paper');
      if (!paper) return res.status(204).send('paper doesn\'t exist');
      return res.end('success');
    });


    //update the paper document
    // req.paper.update(req.updateObj, function(err, numAffected) {
    //   if (err) return res.status(500).send('update not successful');
    //   return res.json(numAffected);
    // });
  });

  //get a particular user's papers
  app.get('/api/papers/user', jwtAuth, function(req, res) {
    Paper.find({userId: req.user._id}, function(err, papers) {
      if (err) return res.status(500).send('server error');
      return res.json(papers);
    });
  });

  // get all papers from a class without pdf
  app.get('/api/papers/class/:classId', function(req, res) {
    console.time('getPapersByClass');
    var query = Paper.find({classId: req.params.classId});

    query.select('-img');

    query.exec(function(err, papers) {
      if (err) return res.status(500).send('database error');
      console.timeEnd('getPapersByClass');
      return res.json(papers);
    });
  });

  //get all papers by type
  app.get('/api/papers/classAndType/class/:classId', function( req, res ) {
    console.dir(req.params.classId, req.params.typeCode);
    Paper.find({classId: req.params.classId}, function( err, papers) {
      if (err) return res.status(500).send('database error');
      return res.json(papers);
    });

  });
};
