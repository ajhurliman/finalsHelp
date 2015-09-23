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
var karma              = require('karma').server;
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
    var longCompanyCode = (companyCode === 'HAL'?'holland':'seabourn');

    return {
        name: 'ApplicationConfiguration',
        constants: {
            Configuration: {
                halPorta: {
                    clientId: 'secondaryFlow' //*******CHANGE TO 'olci' when DSSF endpoints are ready
                },
                disableRTD: (env === 'e2e'),
                enableAjaxLogging: (env === 'prod'),
                timeoutInMillis: 15000, // request timeout 15 seconds
                tokenTimeout: 15 * 60 * 1000, // 15 minutes
                companyCode: companyCode,
                appName: companyCode.toLowerCase()
                // frontend: {
                //     baseUrl: constants.SERVER_MAP[env][longCompanyCode].frontend
                // },
                // frontendBooking: {
                //     baseUrl: constants.SERVER_MAP[env][longCompanyCode].frontendBooking
                // }
            }
        },
        //wrap: 'amd',
        space: '    '
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

function unitTest(singleRun) {
    var deferred = Q.defer();
    var karmaconf = {
        configFile: __dirname + '/config/karma.conf.hal.js',
        singleRun: singleRun
    };

    if(env === 'dev' && !argv.browsers && os.platform().toLowerCase().indexOf('win') > -1){
        //force windows to use Chrome_small because of a PhantomJS bug
        karmaconf.browsers = ['Chrome_small'];
    }else if(argv.browsers){
        karmaconf.browsers = argv.browsers.split(',');
    }
    if(argv.reporters){
        karmaconf.reporters = argv.reporters.split(',');
    }

    karma.start(karmaconf, function(err) {
        console.log('Karma has exited with ' + err);
        deferred.resolve();

        if(!singleRun) {
            process.exit(err);
        }
    });

    return deferred.promise;
}

gulp.task('killSelenium', shell.task(['sh ./test/scripts/killSelenium.sh']));

gulp.task('qa', ['webserverNoTar'], function() {
    return protractorTest();
});

gulp.task('localImgs', function() {
    return gulp.src('src/assets/images/**/*', {base: 'src/assets/images'})
        .pipe(gulp.dest('./build/hal/assets/'));
});

gulp.task('clean', function(){
    return clean(['./build', './bin']);
});

gulp.task('halAssets', function() {
    return gulp.src(getAssetsFiles(), {'base': '.'})
        .pipe(copy('./build/hal'));
});

gulp.task('sbnAssets', function() {
    return gulp.src(getAssetsFiles(), {'base': '.'})
        .pipe(copy('./build/sbn'));
});

gulp.task('halVendorFonts', function() {
    return gulp.src(constants.VENDOR_ASSET_FILES, {'base': '.'})
        .pipe(flatten())
        .pipe(gulp.dest('./build/hal/assets/fonts'));
});

gulp.task('sbnVendorFonts', function() {
    return gulp.src(constants.VENDOR_ASSET_FILES, {'base': '.'})
        .pipe(flatten())
        .pipe(gulp.dest('./build/sbn/assets/fonts'));
});

gulp.task('halAssetsSubdirs', function(){
    return gulp.src('./src/assets/**/*', {"base": "./src/assets"})
        .pipe(gulp.dest('./build/hal/assets'));
});

gulp.task('sbnAssetsSubdirs', function(){
    return gulp.src('./src/assets/**/*', {"base": "./src/assets"})
        .pipe(gulp.dest('./build/sbn/assets'));
});

gulp.task('halAssetsWCS', function(){
    return gulp.src('./src/wcs/**/*', {"base": "./src/wcs"})
        .pipe(gulp.dest('./build/hal/wcs'));
});

gulp.task('sbnAssetsWCS', function(){
    return gulp.src('./src/wcs/**/*', {"base": "./src/wcs"})
        .pipe(gulp.dest('./build/sbn/wcs'));
});

gulp.task('appTemplates', function() {
    return gulp.src(constants.APP_TEMPLATES, {base: '.'})
        .pipe(html2js({
            outputModuleName: 'templates-app',
            base: 'src/app'
        }))
        .pipe(concat('templates-app.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./build/hal'))
        .pipe(gulp.dest('./build/sbn'));
});

gulp.task('componentTemplates', function() {
    return gulp.src(constants.COMPONENT_TEMPLATES, {base: '.'})
        .pipe(html2js({
            outputModuleName: 'templates-components',
            base: 'src/components'
        }))
        .pipe(concat('templates-components.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./build/hal'))
        .pipe(gulp.dest('./build/sbn'));
});

gulp.task('halLess', function () {
    return gulp.src('./src/less/main.less')
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(rename('olci.css'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./build/hal/assets'));
});

// gulp.task('sbnLess', function () {
//     return gulp.src('./src/less/main.sbn.less')
//         .pipe(sourcemaps.init())
//         .pipe(less())
//         .pipe(rename('olci.css'))
//         .pipe(sourcemaps.write())
//         .pipe(gulp.dest('./build/sbn/assets'));
// });

gulp.task('cssmin', ['halLess'/*,'sbnLess'*/],  function() {
    return gulp.src('./build/**/*.css')
        .pipe(cssmin())
        .pipe(gulp.dest('./build'));
});

gulp.task('cssminSync', function() {
    return gulp.src('./build/**/*.css')
        //.pipe(cssmin())
        .pipe(gulp.dest('./build'));
});

gulp.task('halIndexTemplate', ['appTemplates', 'componentTemplates', 'cssmin'],  function() {
    return gulp.src('src/index.html', {base: './src'})
        .pipe(template({
            styles: [].concat(['assets/olci.css'], constants.VENDOR_CSS_FILES),
            scripts: [vendorJsFilename, appJsFilename, 'templates-app.js', 'templates-components.js', 'src/components/configuration.js'],
            version: pkg.version
        }))
        .pipe(gulp.dest('./build/hal'));
});

gulp.task('halIndexTemplateSync', function() {
    return gulp.src('src/index.html', {base: './src'})
        .pipe(template({
            styles: [].concat(['assets/olci.css'], constants.VENDOR_CSS_FILES),
            scripts: [vendorJsFilename, appJsFilename, 'templates-app.js', 'templates-components.js', 'src/components/configuration.js'],
            version: pkg.version
        }))
        .pipe(gulp.dest('./build/hal'));
});

gulp.task('sbnIndexTemplate', ['appTemplates', 'componentTemplates', 'cssmin'],  function() {
    return gulp.src('src/index.html', {base: './src'})
        .pipe(template({
            styles: [].concat(['assets/olci.css'], constants.VENDOR_CSS_FILES),
            scripts: [vendorJsFilename, appJsFilename, 'templates-app.js', 'templates-components.js', 'src/components/configuration.js'],
            version: pkg.version
        }))
        .pipe(gulp.dest('./build/sbn'));
});

gulp.task('sbnIndexTemplateSync', function() {
    return gulp.src('src/index.html', {base: './src'})
        .pipe(template({
            styles: [].concat(['assets/olci.css'], constants.VENDOR_CSS_FILES),
            scripts: [vendorJsFilename, appJsFilename, 'templates-app.js', 'templates-components.js', 'src/components/configuration.js'],
            version: pkg.version
        }))
        .pipe(gulp.dest('./build/sbn'));
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
            .pipe(gulp.dest('./build/hal'))
            .pipe(gulp.dest('./build/sbn'));
    } else {
        console.log('concatenating vendorJs');
        return gulp.src(constants.VENDOR_JS_FILES)
            .pipe(sourcemaps.init())
            .pipe(concat(vendorJsFilename))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('./build/hal'))
            .pipe(gulp.dest('./build/sbn'));
    }
});

gulp.task('appJs', ['halConfig', 'sbnConfig'], function() {
    var templateFiles = getTemplateJSFiles();

    if (isReleaseBuild()) {
        console.log('uglifying appJs');
        return gulp.src(templateFiles)
            .pipe(sourcemaps.init())
            .pipe(annotate())
            .pipe(uglify())
            .pipe(concat(appJsFilename))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('./build/hal'))
            .pipe(gulp.dest('./build/sbn'));
    } else {
        console.log('concatenating appJs');
        return gulp.src(templateFiles)
            .pipe(sourcemaps.init())
            .pipe(concat(appJsFilename))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('./build/hal'))
            .pipe(gulp.dest('./build/sbn'));
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
            .pipe(gulp.dest('./build/hal'))
            .pipe(gulp.dest('./build/sbn'));
    } else {
        console.log('concatenating appJs');
        return gulp.src(templateFiles)
            .pipe(sourcemaps.init())
            .pipe(concat(appJsFilename))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('./build/hal'))
            .pipe(gulp.dest('./build/sbn'));
    }
});

gulp.task('halConfig', function(){
    return gulp.src('version.txt')
        .pipe(ngConstant(getApplicationConfiguration('HAL')))
        .pipe(rename('configuration.js'))
        .pipe(gulp.dest('./build/hal/src/components/'));
});

gulp.task('sbnConfig', function(){
    return gulp.src('version.txt')
        .pipe(ngConstant(getApplicationConfiguration('SBN')))
        .pipe(rename('configuration.js'))
        .pipe(gulp.dest('./build/sbn/src/components/'));
});

gulp.task('build', function() {
    runSequence(
        'halAssets',
        'sbnAssets',
        'halAssetsSubdirs',
        'sbnAssetsSubdirs',
        'halAssetsWCS',
        'sbnAssetsWCS',
        'halVendorFonts',
        'sbnVendorFonts',
        'appTemplates',
        'appJs',
        'vendorJs',
        'halIndexTemplate',
        'sbnIndexTemplate',
        'componentTemplates',
        // 'localImgs',
        'halConfig',
        'sbnConfig',
        'copyFiles'
    );
});

gulp.task('buildNoTar', function() {
    runSequence(
        'clean',
        'halAssets',
        'sbnAssets',
        'halAssetsSubdirs',
        'sbnAssetsSubdirs',
        'halAssetsWCS',
        'sbnAssetsWCS',
        'halVendorFonts',
        'sbnVendorFonts',
        'appTemplates',
        'appJs',
        'vendorJs',
        'halIndexTemplate',
        'sbnIndexTemplate',
        'componentTemplates',
        'halConfig',
        'sbnConfig',
        'copyFiles'
    );
});


gulp.task('copyFiles', function() {
    gulp.src(['./build/**/*', '!./build/**/olci.css'], {"base": "."})
        .pipe(copy('./bin'));
});

gulp.task(releaseString, ['build'], function() {
    // this is different from the build task in only that isReleaseBuild will return true
});

gulp.task('bump', function(){
    var version = null;
    var deferred = Q.defer();
    gulp.src(['package.json', 'bower.json'])
        .pipe(bump())
        .pipe(tap(function(file){
            if(version){ return; }
            var json = JSON.parse(String(file.contents));
            version = json.version;
        }))
        .pipe(gulp.dest('./test'))
        .on('end', function(){
            gulp.src(['version.txt'])
                .pipe(jeditor(function(json){
                    json.versionInfo.version = version;
                    return json;
                }))
                .pipe(gulp.dest('./'))
                .pipe(git.commit('Releasing version '+version))
                .pipe(git.tag("v" + version, "", function (err) {  // How do I get version here?
                    if (err){
                        deferred.reject();
                        throw err;
                    }
                }))
                .on('end', function(){
                    deferred.resolve();
                })
                .on('error', function(e){ throw e; });
        });
    return deferred.promise;
});


gulp.task('protractor', ['webserver'], function() {
    gulp.src(["./test/specs/*.js"])
      .pipe(protractor({
          configFile: "test/protractor.config.js",
          args: ['--baseUrl', 'https://localhost:4321']
      }))
      .on('error', function(e) { throw e });
});

gulp.task('unit', function() {
    return unitTest();
});

gulp.task('unitSync', function() {
    return unitTest();
});

gulp.task('unitSingle', function() {
    return unitTest(true);
});

gulp.task('startHALServer', function() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    return startWebServer('./build/hal', 4321, 4322);
});

gulp.task('startSBNServer', function() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    return startWebServer('./build/sbn', 4040, 4041);
});

gulp.task('startHALServerSync', function() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    return startWebServer('./build/hal', 4321, 4322);
});

gulp.task('startSBNServerSync', function() {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    return startWebServer('./build/sbn', 4040, 4041);
});

gulp.task('webserver', function() {
    runSequence(
        'build',
        'startHALServer',
        'startSBNServer'
    );
});

gulp.task('webserverNoTar', function() {
    runSequence(
        'buildNoTar',
        'startHALServerSync',
        'startSBNServerSync'
    );
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
    gulp.watch(templateFiles, ['halAssets', 'sbnAssets']);

    gulp.watch('src/assets/**/*', logChangedFile);
    gulp.watch('src/assets/**/*', ['halAssetsSubdirs', 'sbnAssetsSubdirs']);

    gulp.watch('src/**/*.less', logChangedFile);
    gulp.watch('src/**/*.less', ['cssmin', 'unitSingle', 'appTemplates']);
});



gulp.task('default', ['build', 'webserver', 'watch', 'unit']);
gulp.task('buildDev', ['webserverNoTar', 'watch', 'unit']);


//////////////////////////////////////////////////////////////////////////////////                                                                    
//  _____             _                              _____     _ _   _          //
// |   __|_ _ ___ ___| |_ ___ ___ ___ ___ _ _ ___   | __  |_ _|_| |_| |         //
// |__   | | |   |  _|   |  _| . |   | . | | |_ -|  | __ -| | | | | . |         //
// |_____|_  |_|_|___|_|_|_| |___|_|_|___|___|___|  |_____|___|_|_|___|         //
//       |___|                                                                  //
//////////////////////////////////////////////////////////////////////////////////  
gulp.task('buildSync', function() {
    runSequence(
        'clean',
        'halAssets',
        'sbnAssets',
        'halVendorFonts',
        'sbnVendorFonts',
        'appTemplates',
        'halConfig',
        'sbnConfig',
        'appJsSync',
        'vendorJs',
        'componentTemplates',
        'halLess',
        // 'sbnLess',
        'cssminSync',
        'halIndexTemplateSync',
        'sbnIndexTemplateSync',
        'halAssetsSubdirs',
        // 'unitSync',
        'watch'
    );
});
