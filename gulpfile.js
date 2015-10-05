var gulp               = require('gulp');
var html2js            = require('gulp-html2js');
var copy               = require('gulp-copy');
var clean              = require('del');
var constants          = require('./config/constants');
var concat             = require('gulp-concat');
var annotate           = require('gulp-ng-annotate');
var uglify             = require('gulp-uglify');
var argv               = require('yargs').argv;
var cssmin             = require('gulp-cssmin');
var template           = require('gulp-template');
var sourcemaps         = require('gulp-sourcemaps');
var less               = require('gulp-less');
var rename             = require('gulp-rename');
var flatGlob           = require('flatten-glob');
var pkg                = require('./package.json');
var jeditor            = require('gulp-json-editor');
var flatten            = require('gulp-flatten');
var Q                  = require('q');
var tap                = require('gulp-tap');
var jshint             = require('gulp-jshint');
var stylish            = require('jshint-stylish');
var os                 = require('os');
// var karma              = require('karma').server;
var jasmine            = require('gulp-jasmine');
var bump               = require('gulp-bump');
var ngConstant         = require('gulp-ng-constant');
var webserver          = require('gulp-webserver');
var protractor         = require('gulp-protractor').protractor;
var shell              = require('gulp-shell');
var runSequence        = require('run-sequence');
var BuildConfiguration = require('./config/BuildConfiguration');

var env = argv.env || 'dev';
var appJsFilename = 'olciApp.js',
    vendorJsFilename = 'olciVendor.js',
// following string signifies a non-debug, ready to deploy version of the app
    releaseString = 'release';

var buildConfiguration = new BuildConfiguration(argv);

if (env === 'dev') {
    console.log('this is dev');
}
else {
    console.log('this is not dev');
}

function isReleaseBuild() {
    return (argv['_'].indexOf(releaseString) !== -1);
}

function mergeArrays() {
    var outArr = [];
    for (var i in arguments) {
        outArr = outArr.concat(arguments[i]);
    }
    return outArr;
}

function logChangedFile(event) {
    var time = new Date();
    var timeStr = "[" +
        ("0" + time.getHours()).slice(-2) + ":" +
        ("0" + time.getMinutes()).slice(-2) + ":" +
        ("0" + time.getSeconds()).slice(-2) +
        "]";

    console.log(timeStr,"Change   '" + "\x1b[33m" + event.path + "\x1b[0m" + "'");
};

function getAssetsFiles() {
    return mergeArrays(constants.VENDOR_JS_FILES,
        constants.VENDOR_CSS_FILES,
        constants.APP_JS_FILES);
}

function getTemplateJSFiles() {
    return flatGlob.sync(mergeArrays(
        constants.APP_JS_FILES,
        'templates-app.js',
        'templates-components.js'));
}

function getApplicationConfiguration(companyCode) {
    var longCompanyCode = (companyCode === 'UW'?'holland':'seabourn');

    return {
        name: 'ApplicationConfiguration',
        constants: {
            Configuration: {
                timeoutInMillis: 15000, // request timeout 15 seconds
                tokenTimeout: 15 * 60 * 1000, // 15 minutes
                companyCode: companyCode,
                appName: companyCode.toLowerCase()
            }
        }
    };
}

function startWebServer(srcDir, port, livereloadPort) {
    // console.log('proxyDomainURL: ', proxyDomainURL);
    return gulp.src(srcDir)
        .pipe(webserver({
            host: '0.0.0.0',
            port: port,
            livereload: {enable: true, port: livereloadPort},
            fallback: 'index.html',
            https: true,
            key: 'config/grunt-connect/server.key',
            cert: 'config/grunt-connect/server.crt'
        }));
}

function protractorTest() {

    return gulp.src(['./test/smoke/**/*.spec.js'])
        .pipe(protractor({
            seleniumServerJar: './node_modules/protractor/selenium/selenium-server-standalone-2.45.0.jar',
            // configFile       : './test/conf/protractor.e2eTests.js',
            configFile: './test/protractor.conf.js',
            debug            : false
            // args             : args
        }))
        .on('end', function () {
            process.exit(0);
        })
        .on('error', function (e) {
            throw e
        });
}

gulp.task('clean', function(){
    return clean(['./build', './bin']);
});

gulp.task('uwAssets', function() {
    return gulp.src(getAssetsFiles(), {'base': '.'})
        .pipe(copy('./build/uw'));
});

gulp.task('wsuAssets', function() {
    return gulp.src(getAssetsFiles(), {'base': '.'})
        .pipe(copy('./build/wsu'));
});

gulp.task('uwVendorFonts', function() {
    return gulp.src(constants.VENDOR_ASSET_FILES, {'base': '.'})
        .pipe(flatten())
        .pipe(gulp.dest('./build/uw/assets/fonts'));
});

gulp.task('wsuVendorFonts', function() {
    return gulp.src(constants.VENDOR_ASSET_FILES, {'base': '.'})
        .pipe(flatten())
        .pipe(gulp.dest('./build/wsu/assets/fonts'));
});

gulp.task('uwAssetsSubdirs', function(){
    return gulp.src('./src/assets/**/*', {"base": "./src/assets"})
        .pipe(gulp.dest('./build/uw/assets'));
});

gulp.task('wsuAssetsSubdirs', function(){
    return gulp.src('./src/assets/**/*', {"base": "./src/assets"})
        .pipe(gulp.dest('./build/wsu/assets'));
});

gulp.task('appTemplates', function() {
    return gulp.src(constants.APP_TEMPLATES, {base: '.'})
        .pipe(html2js({
            outputModuleName: 'templates-app',
            base: 'src/app'
        }))
        .pipe(concat('templates-app.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./build/uw'));
        // .pipe(gulp.dest('./build/wsu'));
});

gulp.task('componentTemplates', function() {
    return gulp.src(constants.COMPONENT_TEMPLATES, {base: '.'})
        .pipe(html2js({
            outputModuleName: 'templates-components',
            base: 'src/components'
        }))
        .pipe(concat('templates-components.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./build/uw'));
        // .pipe(gulp.dest('./build/wsu'));
});

gulp.task('uwLess', function () {
    return gulp.src('./src/less/main.less')
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(rename('olci.css'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./build/uw/assets'));
});

// gulp.task('wsuLess', function () {
//     return gulp.src('./src/less/main.wsu.less')
//         .pipe(sourcemaps.init())
//         .pipe(less())
//         .pipe(rename('olci.css'))
//         .pipe(sourcemaps.write())
//         .pipe(gulp.dest('./build/wsu/assets'));
// });

gulp.task('cssmin', ['uwLess'/*,'wsuLess'*/],  function() {
    return gulp.src('./build/**/*.css')
        .pipe(cssmin())
        .pipe(gulp.dest('./build'));
});

gulp.task('cssminSync', function() {
    return gulp.src('./build/**/*.css')
        //.pipe(cssmin())
        .pipe(gulp.dest('./build'));
});

gulp.task('uwIndexTemplateSync', function() {
    return gulp.src('src/index.html', {base: './src'})
        .pipe(template({
            styles: [].concat(['assets/olci.css'], constants.VENDOR_CSS_FILES),
            scripts: [vendorJsFilename, appJsFilename, 'templates-app.js', 'templates-components.js', 'src/components/configuration.js'],
            version: pkg.version
        }))
        .pipe(gulp.dest('./build/uw'));
});

gulp.task('wsuIndexTemplateSync', function() {
    return gulp.src('src/index.html', {base: './src'})
        .pipe(template({
            styles: [].concat(['assets/olci.css'], constants.VENDOR_CSS_FILES),
            scripts: [vendorJsFilename, appJsFilename, 'templates-app.js', 'templates-components.js', 'src/components/configuration.js'],
            version: pkg.version
        }))
        .pipe(gulp.dest('./build/wsu'));
});

gulp.task('vendorJs', function () {
    if (isReleaseBuild()) {
        console.log('uglifying vendorJs');
        return gulp.src(constants.VENDOR_JS_FILES)
            .pipe(sourcemaps.init())
            .pipe(annotate())
            .pipe(uglify())
            .pipe(concat(vendorJsFilename))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('./build/uw'));
            // .pipe(gulp.dest('./build/wsu'));
    } else {
        console.log('concatenating vendorJs');
        return gulp.src(constants.VENDOR_JS_FILES)
            .pipe(sourcemaps.init())
            .pipe(concat(vendorJsFilename))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('./build/uw'));
            // .pipe(gulp.dest('./build/wsu'));
    }
});

gulp.task('appJs', ['uwConfig', 'wsuConfig'], function() {
    var templateFiles = getTemplateJSFiles();

    if (isReleaseBuild()) {
        console.log('uglifying appJs');
        return gulp.src(templateFiles)
            .pipe(sourcemaps.init())
            .pipe(annotate())
            .pipe(uglify())
            .pipe(concat(appJsFilename))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('./build/uw'));
            // .pipe(gulp.dest('./build/wsu'));
    } else {
        console.log('concatenating appJs');
        return gulp.src(templateFiles)
            .pipe(sourcemaps.init())
            .pipe(concat(appJsFilename))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('./build/uw'));
            // .pipe(gulp.dest('./build/wsu'));
    }
});

gulp.task('appJsSync', function() {
    var templateFiles = getTemplateJSFiles();

    if (isReleaseBuild()) {
        console.log('uglifying appJs');
        return gulp.src(templateFiles)
            .pipe(sourcemaps.init())
            .pipe(annotate())
            .pipe(uglify())
            .pipe(concat(appJsFilename))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('./build/uw'));
            // .pipe(gulp.dest('./build/wsu'));
    } else {
        console.log('concatenating appJs');
        return gulp.src(templateFiles)
            .pipe(sourcemaps.init())
            .pipe(concat(appJsFilename))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('./build/uw'));
            // .pipe(gulp.dest('./build/wsu'));
    }
});

gulp.task('uwConfig', function(){
    return gulp.src('version.txt')
        .pipe(ngConstant(getApplicationConfiguration('UW')))
        .pipe(rename('configuration.js'))
        .pipe(gulp.dest('./build/uw/src/components/'));
});

gulp.task('wsuConfig', function(){
    return gulp.src('version.txt')
        .pipe(ngConstant(getApplicationConfiguration('WSU')))
        .pipe(rename('configuration.js'))
        .pipe(gulp.dest('./build/wsu/src/components/'));
});


gulp.task('copyFiles', function() {
    gulp.src(['./build/**/*', '!./build/**/olci.css'], {"base": "."})
        .pipe(copy('./bin'));
});

gulp.task('watch', function() {
    var templateFiles = getTemplateJSFiles();

    gulp.watch(constants.APP_TEMPLATES, logChangedFile);
    gulp.watch(constants.APP_TEMPLATES, ['appTemplates']);

    gulp.watch(constants.COMPONENT_TEMPLATES, logChangedFile);
    gulp.watch(constants.COMPONENT_TEMPLATES, ['componentTemplates']);

    gulp.watch(constants.VENDOR_JS_FILES, logChangedFile);
    gulp.watch(constants.VENDOR_JS_FILES, ['vendorJs']);

    gulp.watch(constants.APP_JS_FILES, logChangedFile);
    gulp.watch(constants.APP_JS_FILES, ['appJs']);

    gulp.watch(templateFiles, logChangedFile);
    gulp.watch(templateFiles, ['uwAssets', 'wsuAssets']);

    gulp.watch('src/assets/**/*', logChangedFile);
    gulp.watch('src/assets/**/*', ['uwAssetsSubdirs', 'wsuAssetsSubdirs']);

    gulp.watch('src/**/*.less', logChangedFile);
    gulp.watch('src/**/*.less', ['cssmin', 'appTemplates']);
});

gulp.task('default', function() {
    runSequence(
        'clean',
        'uwAssets',
        // 'wsuAssets',
        'uwVendorFonts',
        // 'wsuVendorFonts',
        'appTemplates',
        'uwConfig',
        // 'wsuConfig',
        'appJsSync',
        'vendorJs',
        'componentTemplates',
        'uwLess',
        // 'wsuLess',
        'cssminSync',
        'uwIndexTemplateSync',
        // 'wsuIndexTemplateSync',
        'uwAssetsSubdirs',
        'watch'
    );
});
