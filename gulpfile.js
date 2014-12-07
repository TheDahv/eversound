var gulp = require('gulp'),
jshint   = require('gulp-jshint'),
del      = require('del'),
path     = require('path'),
es       = require('event-stream'),
_        = require('underscore'),
// Constants
SCRIPTS_SRC = '_assets/js/**/*.js';

gulp.task('clean:scripts', function (cb) {
  return del('public/js/**', cb);
});

gulp.task('move-scripts', ['clean:scripts'], function () {
  // Grab all project JavaScript sources
  return gulp.src(SCRIPTS_SRC)
    // Move everything to the static assets folder served by Express
    .pipe(gulp.dest('public/js/'));
});

gulp.task('lint', function () {
  return gulp.src([SCRIPTS_SRC, '!_assets/js/vendor/**', '!_assets/js/adapter.js'])
    .pipe(jshint())
    .pipe(jshint.reporter(require('jshint-stylish')));
});

gulp.task('watch:scripts', function () {
  return gulp.watch(SCRIPTS_SRC, ['lint', 'move-scripts']);
});

gulp.task('watch', ['watch:scripts'], function () {
  console.log("Watching your project...");
});
