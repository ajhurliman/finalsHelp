var constants = {
    // File patterns for app, component, and debug templates (used for dev vs prod compilation)
    APP_TEMPLATES: ['src/app/**/*.tpl.html', '!src/app/**/*.debug.tpl.html'],
    APP_DEBUG_TEMPLATES: ['src/app/**/*.debug.tpl.html'],
    COMPONENT_TEMPLATES: ['src/components/**/*.tpl.html', '!src/components/**/*.debug.tpl.html'],
    COMPONENT_DEBUG_TEMPLATES: ['src/components/**/*.debug.tpl.html'],

    // File pattern for the production JS files (all JS minus all development files)
    APP_JS_FILES: [ 'src/**/*.js', '!src/**/*.spec.js' ],

    VENDOR_ASSET_FILES: [
        'vendor/bootstrap/fonts/*',
        'src/assets/**/*'
    ],

    VENDOR_CSS_FILES: [
        'vendor/angular-ui-select/dist/select.css',
        'vendor/angular-busy/dist/angular-busy.min.css'
    ],

    // Canonical list of 3rd party files that need to be built into the minified JS file.
    VENDOR_JS_FILES: [
        'vendor/angular/angular.js',
        'vendor/angular-bootstrap/ui-bootstrap-tpls.min.js',
        'vendor/angular-ui-router/release/angular-ui-router.js',
        'vendor/angular-bootstrap-show-errors/src/showErrors.min.js',
        'vendor/underscore/underscore.js',
        'vendor/restangular/dist/restangular.js',
        'vendor/angular-translate/angular-translate.js',
        'vendor/steelToe/steelToe.js',
        'vendor/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
        'vendor/ngstorage/ngStorage.min.js',
        'vendor/angular-ui-utils/ui-utils.min.js',
        'vendor/angular-base64/angular-base64.min.js',
        'vendor/angular-ui-select/dist/select.min.js',
        'vendor/angular-payments/lib/angular-payments.min.js',
        'vendor/angular-busy/dist/angular-busy.min.js',
        'vendor/angular-momentjs-service/release/angular-momentjs-service.min.js',
        'vendor/ng-file-upload/ng-file-upload.min.js',
        'vendor/pdfjs-dist/build/pdf.combined.js',
        'vendor/angular-smart-table/dist/smart-table.min.js'
    ],

    // File patterns for test files
    TEST_SUPPORT_FILES: [ 'vendor/angular-mocks/angular-mocks.js', 'spec/angular/**/*.js' ],
    UNIT_TESTS: ['src/**/*.spec.js']

};

module.exports = constants;
