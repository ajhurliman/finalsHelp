'use strict';

var fs = require('fs');
var chai = require('chai');
var chaiHttp = require('chai-http');
var mongoose = require('mongoose');
var expect = chai.expect;
var url = 'http://localhost:3000';

chai.use(chaiHttp);

require('../../server');

describe('papers', function() {
  before(function() {
    mongoose.connection.collections.users.drop(function(err) {
      if (err) { console.log(err); }
    });
    mongoose.connection.collections.papers.drop(function(err) {
      if (err) { console.log(err); }
    });
  });

  var tempJWT;
  var tempPaperId;

  it('should create a new user', function(done) {
    chai.request(url)
    .post('/api/users')
    .field('email', 'test@example.com')
    .field('password', 'asdf')
    .field('passwordConfirm', 'asdf')
    .end(function(err, res) {
      expect(err).to.be.null;
      expect(res.body).to.have.property('jwt').that.is.a('string');
      tempJWT = res.body.jwt;
      done();
    });
  });

  it('should add a paper', function(done) {
    chai.request(url)
    .post('/api/papers')
    .set('jwt', tempJWT)
    .attach('file', __dirname + '/DSCN0119.JPG')
    .field('title', 'my cool title')
    .field('descrip', 'the body of the paper')
    .end(function(err, res) {
      expect(err).to.be.null;
      expect(res).to.not.have.status(500);
      expect(res.body).to.include.keys('img', 'title', 'descrip', 'date', 'userId');
      tempPaperId = res.body._id;
      done();
    });
  });

  it('should return one paper given a paper id', function(done) {
    chai.request(url)
    .get('/api/papers/single/' + tempPaperId)
    .end(function(err, res) {
      expect(err).to.be.null;
      expect(res).to.not.have.status(500);
      expect(res.body).to.include.keys('img', 'title', 'descrip', 'date', 'userId');
      done();
    });
  });

  it('should update a paper', function(done) {
    chai.request(url)
    .put('/api/papers/single/' + tempPaperId)
    .set('jwt', tempJWT)
    .attach('file', __dirname + '/DSCN0196.JPG')
    .field('paperBody', 'the new body of the paper')
    .field('descrip', 'new descrip')
    .end(function(err, res) {
      expect(err).to.be.null;
      expect(res).to.not.have.status(500);
      expect(res).to.not.have.status(403);
      expect(res.body).to.have.deep.property('ok').to.not.eql(false);
      done();
    });
  });

  it('should return a paper\'s image given a paper id', function(done) {
    chai.request(url)
    .get('/api/papers/single/image/' + tempPaperId)
    .end(function(err, res) {
      expect(err).to.be.null;
      expect(res).to.not.have.status(500);
      expect(res).to.have.header('transfer-encoding', 'chunked');
      //create file
      fs.writeFileSync(__dirname + '/testImage.jpeg');
      //make write stream out of file
      var writeStream = fs.createWriteStream(__dirname + '/testImage.jpeg');
      //pipe res into write stream
      res.on('data', function(data) {
        writeStream.write(data);
      });
      //check if that file exists
      res.on('end', function() {
        fs.exists(__dirname + '/testImage.jpeg', function(exists) {
          expect(exists).to.be.true;
          fs.unlinkSync(__dirname + '/testImage.jpeg');
          done();
        });
      });
    });
  });

  it('should get a user\'s papers', function(done) {
    chai.request(url)
    .get('/api/papers/user')
    .set('jwt', tempJWT)
    .end(function(err, res) {
      expect(err).to.be.null;
      expect(res).to.not.have.status(500);
      expect(res.body).to.be.an('array');
      done();
    });
  });

  //this is for the get('/api/papers/location') route;
  //it shows that it excludes papers outside its range
  it('should add another paper', function(done) {
    chai.request(url)
    .post('/api/papers')
    .set('jwt', tempJWT)
    .field('title', 'out of range paper')
    .field('descrip', 'this paper is not in range')
    .end(function(err, res) {
      expect(err).to.be.null;
      expect(res.body).to.include.keys('title', 'descrip', 'date', 'userId');
      tempPaperId = res.body._id;
      done();
    });
  });


  // location based tests, no need
  // it('should get papers inside a range of coordinates', function(done) {
  //   chai.request(url)
  //   .get('/api/papers/location')
  //   .set('latMin', 46.34234)
  //   .set('latMax', 48.34234)
  //   .set('lngMin', -127.91233)
  //   .set('lngMax', -127.24234)
  //   .end(function(err, res) {
  //     expect(err).to.be.null;
  //     expect(res.body).to.be.an('array')
  //       .to.have.deep.property('[0].title', 'my cool title');
  //     done();
  //   });
  // });

  // before(function() {
  //   for (var i = 0; i < 201; i++) {
  //     mongoose.connection.collections.papers.insert({
  //       userId: '546d3092ad2269026e83de6c',
  //       title: i,
  //       paperBody: 'a paper',
  //       lat: 47.0005,
  //       lng: -122.05
  //     }, function(err) {
  //       if (err) return err;
  //     });
  //   }
  // });

  // it('should return a count instead of an array of papers', function(done) {
  //   chai.request(url)
  //   .get('/api/papers/location')
  //   .set('latMin', 47.0004)
  //   .set('latMax', 47.0006)
  //   .set('lngMin', -122.06)
  //   .set('lngMax', -122.04)
  //   .end(function(err, res) {
  //     expect(err).to.be.null;
  //     expect(res.body).to.have.property('paperCount')
  //       .that.eql(201);
  //     done();
  //   });
  // });

});
