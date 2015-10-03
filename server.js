'use strict';

require("appdynamics").profile({
    controllerHostName: 'www.finalshelp.com',
    controllerPort: 80, // If SSL, be sure to enable the next line  
    accountName: 'FinalsHelpcom', // Required for a controller running in multi-tenant mode
    accountAccessKey: 'ml8a3qr7o9oi', // Required for a controller running in multi-tenant mode
    applicationName: 'FinalsHelp',
    tierName: 'tier1',
    nodeName: 'process' // The controller will automatically append the node name with a unique number
});

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
