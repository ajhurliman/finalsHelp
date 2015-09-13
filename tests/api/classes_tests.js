'use strict';

var chai = require('chai');
var chaiHttp = require('chai-http');
var mongoose = require('mongoose');
var expect = chai.expect;

var url = 'http://localhost:3000';
var jwt = require('jwt-simple');

require('../../server');

chai.use(chaiHttp);

describe('classes', function() {
  before(function() {
    mongoose.connection.collections.classes.drop(function(err) {
      if (err) {console.log(err);}
    });
    mongoose.connection.collections.users.drop(function(err) {
      if (err) {console.log(err);}
    });
  });

  var tempJWT;
  var tempClassId;

  it('should create a new user', function(done) {
    chai.request(url)
    .post('/api/users')
    .field('email', 'test@example.com')
    .field('password', 'asdf')
    .field('passwordConfirm', 'asdf')
    .end(function(err, res) {
      expect(err).to.be.null;
      expect(res).to.not.have.status(500);
      expect(res.body).to.have.property('jwt').that.is.a('string');
      tempJWT = res.body.jwt;
      done();
    });
  });

  it('should add a class', function(done) {
    chai.request(url)
    .post('/api/classes')
    .set('jwt', tempJWT)
    .field('title', 'my cool class')
    .field('descrip', 'my cool description')
    .end(function(err, res) {
      expect(err).to.be.null;
      expect(res).not.to.have.status(500);
      expect(res.body).to.include.keys('title', 'descrip', 'date', 'createdBy');
      tempClassId = res.body._id;
      done();
    })
  });

  // it('should delete a class', function(done) {
  //   chai.request(url)
  //   .delete('/api/classes/' + tempClassId)
  //   .set('jwt', tempJWT)
  //   .end(function(err, res) {
  //     expect(err).to.be.null;
  //     expect(res).no.to.have.status(500);
  //     done();
  //   });
  // });


});

