gulp-bless v0.0.3 [![Build Status](https://travis-ci.org/adam-lynch/gulp-bless.png)](https://travis-ci.org/adam-lynch/gulp-bless)
==========

CSS post-processor which splits CSS files suitably for Internet Explorer &lt; 10.   

This is the a [Gulp](http://github.com/gulpjs/gulp) wrapper around [bless.js](https://github.com/paulyoung/bless.js) (see [blesscss.com](http://blesscss.com/)).

# Information
<table>
<tr>
<td>Package</td><td>gulp-bless</td>
</tr>
<tr>
<td>Description</td>
<td>CSS post-processor which splits CSS files suitably for Internet Explorer &lt; 10. Bless + Gulp = gulp-bless.</td>
</tr>
<tr>
<td>Node Version</td>
<td>>= 0.9</td>
</tr>
</table>

# Installation
```js
npm install gulp-bless
```

# Usage
```js
var gulp = require('gulp');
var bless = require('gulp-bless');

gulp.task('css', function() {
    gulp.src('style.css')
        .pipe(bless())
        .pipe(gulp.dest('./splitCSS'));
});

gulp.task('default', ['watch']);

// Rerun the task when a file changes
gulp.task('watch', function () {
  gulp.watch('./css/*.css', ['css']);
});
```

**bless(fileName, options)**. The (optional) `options` argument is passed on as is to [bless.js](https://github.com/paulyoung/bless.js).