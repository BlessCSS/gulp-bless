var gulp = require('gulp');
var mocha = require('gulp-mocha');
var coverage = require('gulp-coverage');
var through2 = require('through2');

gulp.task('default', ['test']);

gulp.task('test', function(){
    gulp.src('test/main.js')
        .pipe(coverage.instrument({
            pattern: ['index.js'],
            debugDirectory: 'debug'
        }))
        .pipe(mocha())
        .pipe(coverage.gather())
        .pipe(coverage.enforce({
            statements: 100,
            lines: 100,
            blocks: 100
        }));
});