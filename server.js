'use strict';

var bodyParser = require('body-parser');
var passport = require('passport');
var mongoose = require('mongoose');
var express = require('express');
var app = express();

mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/finals_solution_dev');
app.set('jwtSecret', process.env.SECRET || 'REMEMBERTOCHANGETHIS');

app.use(passport.initialize());
require('./lib/passport')(passport);

app.use(bodyParser.urlencoded({extended: false}));

require('./routes/users_routes')(app, app.get('jwtSecret'), passport, mongoose);
require('./routes/papers_routes')(app, app.get('jwtSecret'), mongoose);
require('./routes/classes_routes')(app, app.get('jwtSecret'), mongoose);

app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), function() {
  console.log('server started on port %d', app.get('port'));
});

module.exports = app;
