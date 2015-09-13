var constants = require('./constants');

/**
 * Creates a new BuildConfiguration object from arguments.
 * @param argv
 */
module.exports = function(argv) {
    this.projectName     = 'finals';
    this.environment     = argv.env || 'dev';
    this.karmaReporters  = !!argv.reporters ? argv.reporters.split(',') : null;
    this.testBrowsers    = !!argv.browsers ? argv.browsers.split(',') : null;
    this.applicationName = argv.app || 'finals';
    this.testSuite       = argv.suite || 'smoke';
    // this.upstream        = argv.upstream || constants.SERVER_MAP[this.environment][this.applicationName].upstream;
};