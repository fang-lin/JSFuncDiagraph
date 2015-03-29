/**
 * Copyright 2006-2015 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

var gulp = require('gulp'),
    util = require('gulp-util'),
    bower = require('gulp-bower'),
    concat = require('gulp-concat'),
    clean = require('gulp-clean'),
    jshint = require('gulp-jshint'),
    nodemon = require('gulp-nodemon'),
    buster = require('gulp-buster'),
    less = require('gulp-less'),
    minifyCss = require('gulp-minify-css'),
    uglify = require('gulp-uglify'),
    amdOptimize = require('amd-optimize'),
    rename = require('gulp-rename'),
    copy2 = require('gulp-copy2'),
    sh = require('shelljs'),
    path = require('path'),
    gulpIf = require('gulp-if'),
    sprite = require('css-sprite').stream,
    Q = require('q'),
    _ = require('underscore'),
    fs = require('fs'),
    config = require('./config');

// region lint

gulp.task('lint', function () {
    return gulp.src([
        'server.js',
        'client/*.js',
        'client/app/*.js'
    ])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(jshint.reporter('fail'));
});

// endregion lint
// region less

gulp.task('less', ['bower'], function () {
    return gulp.src('client/css/main.less')
        .pipe(less())
        .on('error', function (err) {
            util.log(util.colors.red(err));
        })
        .pipe(gulp.dest('client/css/'));
});

// endregion less
// region nodemon

gulp.task('nodemon', function () {
    nodemon({
        script: 'server.js',
        ext: 'js json',
        ignore: ['node_modules/*', 'client/*', 'dist/*'],
        env: {'NODE_ENV': 'DEVELOPMENT'}
    }).on('restart', function () {
        util.log(util.colors.cyan('nodemon restarted'));
    });
});

// endregion nodemon
// region watch

gulp.task('watch', function () {
    gulp.watch('./client/css/*.less', ['less']);
    gulp.watch('./githook.hb', ['git-hook']);
});

// endregion watch
// region bower

gulp.task('bower', ['clean'], function (done) {
    return bower();
});

// endregion bower


gulp.task('sprites', function () {
    return gulp.src('./client/images/*.png')
        .pipe(sprite({
            name: 'sprite',
            style: '_sprite.less',
            cssPath: './img',
            processor: 'less'
        }))
        .pipe(gulpIf('*.png', gulp.dest('./dist/img/'), gulp.dest('./dist/scss/')))
});

// region minify-css

gulp.task('minify-css', ['less'], function () {
    return gulp.src('client/css/main.css')
        .pipe(minifyCss({
            keepSpecialComments: 0
        }))
        .pipe(gulp.dest('dist/css/'));
});

// endregion minify-css
// region git-hook

gulp.task('git-hook', function (done) {
    gulp.src('githook.hb')
        .pipe(rename('pre-commit'))
        .pipe(gulp.dest('.git/hooks/'))
        .on('end', done);
});

// endregion git-hook
// region clean

gulp.task('clean', function () {
    return gulp.src('./dist/*')
        .pipe(clean());
});

// endregion clean
// region compress

gulp.task('compress:requirejs', ['bower'], function () {
    gulp.src('client/lib/requirejs/require.js')
        .pipe(uglify())
        .pipe(gulp.dest('dist/lib/requirejs/'));
});

gulp.task('compress:app', ['bower'], function () {
    return gulp.src('client/*').
        pipe(amdOptimize('init', {
            baseUrl: 'client/',
            configFile: 'client/build-config.js'
        }))
        .pipe(concat('init.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('compress', ['compress:requirejs', 'compress:app']);

// endregion compress
// region copy

gulp.task('copy', ['clean'], function () {
    return copy2([
        {src: 'client/index.html', dest: 'dist/'},
        {src: 'client/favicon.ico', dest: 'dist/'},
        {src: 'client/images/*.*', dest: 'dist/images/'}
    ]);
});

// endregion copy
// region integration

gulp.task('develop', ['nodemon', 'watch', 'git-hook']);

gulp.task('build', ['copy', 'minify-css', 'compress']);

// endregion integration