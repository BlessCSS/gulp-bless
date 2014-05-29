gulp-bless [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url] 
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

**bless(options)**. The (optional) `options` argument is passed on as is to [bless.js](https://github.com/paulyoung/bless.js).
Bless' options are listed here: [paulyoung/bless.js/blob/master/bin/blessc#L10](https://github.com/paulyoung/bless.js/blob/master/bin/blessc#L10).
For example, if you wanted the first CSS chunk / "blessed" file to `@import` the others, then do this:


```javascript
gulp.src('long.css')
        .pipe(bless({
            imports: true
        }))
        .pipe(gulp.dest('./'))
```

## Warning: gulp-bless has changed a lot since 1.0.0
- It no longer concatenates all files that come down the pipeline.
- fileName can no longer be passed directly to the plugin itself.



[npm-url]: https://npmjs.org/package/gulp-bless
[npm-image]: https://badge.fury.io/js/gulp-bless.png

[travis-url]: http://travis-ci.org/adam-lynch/gulp-bless
[travis-image]: https://secure.travis-ci.org/adam-lynch/gulp-bless.png?branch=master

[depstat-url]: https://david-dm.org/adam-lynch/gulp-bless
[depstat-image]: https://david-dm.org/adam-lynch/gulp-bless.png