var constants = require('./constants.js');

module.exports = function(config) {
    config.set({
        basePath: '..',
        runnerPort: 9100,
        autoWatch: true,
        files: [].concat(
            [
                'JASMINE',
                'JASMINE_ADAPTER',
                'vendor/jquery/jquery.js'
            ],
            constants.VENDOR_JS_FILES,
            [
                'build/hal/templates-app.js',
                'build/hal/templates-components.js'
            ],
            [
                'build/hal/src/components/configuration.js'
            ],
            constants.TEST_SUPPORT_FILES,
            [
                'src/**/*.js'
            ]
        ),
        exclude: [
        'src/assets/**/*.js'
        ],
        frameworks: ['jasmine'],
        plugins: [
            'karma-jasmine',
            'karma-coverage',
            'karma-firefox-launcher',
            'karma-chrome-launcher',
            'karma-phantomjs-launcher',
            'karma-ie-launcher',
            'karma-junit-reporter',
            'karma-spec-reporter'
        ],
        preprocessors: {
            'src/!(prototype-*)/**/!(*.spec|*.debug)+(.js)': 'coverage'
        },
        logLevel: config.LOG_ERROR,
        reports: ['dots'],
        junitReporter: {
            outputFile: 'build/test-results.xml',
            suite: ''
        },
        coverageReporter: {
            type: 'cobertura',
            dir: 'build/coverage',
            file: 'coverage.xml'
        },
        browsers: ['PhantomJS'],
        customLaunchers: {
            Chrome_small: {
                base: 'Chrome',
                flags: ['--window-size=400,400']
            }
        },
        captureTimeout: 60000
    });
};