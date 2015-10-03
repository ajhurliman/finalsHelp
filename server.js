'use strict';

var compress    = require( 'compression' );
var bodyParser  = require( 'body-parser' );
var passport    = require( 'passport' );
var mongoose    = require( 'mongoose' );
var express     = require( 'express' );
var app         = express();
process.env.PWD = process.cwd();

mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/finals_solution_dev');
app.set('jwtSecret', process.env.SECRET || 'REMEMBERTOCHANGETHIS');

app.use( compress() );
app.use( passport.initialize() );
app.use( bodyParser.json() );

require( './lib/passport' )( passport );
require( './routes/users_routes' )( app, app.get( 'jwtSecret' ), passport, mongoose) ;
require( './routes/papers_routes' )( app, app.get( 'jwtSecret' ), mongoose );
require( './routes/classes_routes' )( app, app.get( 'jwtSecret' ), mongoose );
require( './routes/tokens_routes' )( app, mongoose );

app.use(express.static( process.env.PWD + '/build/hal' ) );

app.set( 'port', process.env.PORT || 3000 );
app.listen( app.get( 'port' ), function() {
  console.log( 'server started on port %d', app.get( 'port' ) );
});

module.exports = app;
