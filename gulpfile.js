var gulp = require('gulp'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify');

gulp.task('default', function() {
  return gulp.src('angular-emit-to.js')
             .pipe( uglify() )
             .pipe( rename({ extname: '.min.js' }) )
             .pipe( gulp.dest('./') );
});