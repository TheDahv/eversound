var gulp    = require('gulp'),
jshint      = require('gulp-jshint'),
del         = require('del'),
path        = require('path'),
es          = require('event-stream'),
_           = require('underscore'),
sass        = require('gulp-sass'),
// Constants
SCRIPTS_SRC = '_assets/js/**/*.js',
SASS_SRC    = '_assets/sass/*.scss'

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

gulp.task('sass', function () {
  return gulp.src(SASS_SRC)
    .pipe(sass({
      logErrToConsole: true
    }))
    .pipe(gulp.dest('./public/css'));
});

gulp.task('watch:scripts', function () {
  return gulp.watch(SCRIPTS_SRC, ['lint', 'move-scripts']);
});

gulp.task('watch:sass', function () {
  return gulp.watch(SASS_SRC, ['sass']);
});

gulp.task('watch', ['watch:scripts', 'watch:sass'], function () {
  console.log("Watching your project...");
});
