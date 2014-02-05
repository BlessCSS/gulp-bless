var gulp = require('gulp');
var gulpBless = require('./');

gulp.task('bless', function(){
    return gulp.src('./*')
        .pipe(gulpBless())
        .pipe(gulp.dest('./copied/'));
});

gulp.task('default', ['bless']);