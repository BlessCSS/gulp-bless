var mockrequire = require('proxyquire');

var bless       = require('../');
var concat      = require("gulp-concat");
var cleanCss     = require('gulp-clean-css');
var should      = require('should');
var fs          = require('fs');
var path        = require('path');
var File        = require('gulp-util').File;
var Buffer      = require('buffer').Buffer;
var assert      = require('stream-assert');
var gulp        = require('gulp');
var $           = require('gulp-load-plugins')({scope: 'devDependencies'});

describe('gulp-bless', function() {
    describe('bless()', function() {

        it('should do nothing if under the limit', function(done){
            var stream = bless(),
                numberOfNewFiles = 0;

            stream.on('data', function(newFile){
                numberOfNewFiles++;

                should.exist(newFile);
                should.exist(newFile.path);
                should.exist(newFile.relative);
                should.exist(newFile.contents);

                newFile.relative.should.equal('file.css');
                newFile.contents.toString('utf8').should.equal('p {\n  color: red;\n}');
                Buffer.isBuffer(newFile.contents).should.equal(true);
            });

            stream.on('end', function(){
                numberOfNewFiles.should.equal(1);
                done();
            });

            stream.write(new File({
                cwd: "/home/adam/",
                base: "/home/adam/test",
                path: "/home/adam/test/file.css",
                contents: new Buffer("p {color:red}")
            }));
            stream.emit('end');
        });


        it("should pass through a file if it's empty", function(done){
            var stream = bless(),
                numberOfNewFiles = 0;

            stream.on('data', function(newFile){
                numberOfNewFiles++;
                newFile.contents.toString('utf8').should.equal('');
                Buffer.isBuffer(newFile.contents).should.equal(true);
            });

            stream.on('end', function(){
                numberOfNewFiles.should.equal(1);
                done();
            });

            stream.write(new File({
                cwd: "/home/adam/",
                base: "/home/adam/test",
                path: "/home/adam/test/empty.css",
                contents: new Buffer("")
            }));
            stream.end();
        });


        it('should split when selector count is over the limit', function(done){
            var stream = bless();

            fs.readFile('./test/css/long.css', function(err, data){
                if(err) throw new Error(err);

                var longStylesheet = new File({
                        cwd: "/home/adam/",
                        base: "/home/adam/test",
                        path: "/home/adam/test/long-split.css",
                        contents: new Buffer(data)
                    }),
                    expectedSplits = [];

                fs.readFile('./test/css/long-split.css', function(err, data){
                    if(err) throw new Error(err);

                    expectedSplits.push(new File({
                        cwd: "/home/adam/",
                        base: "/home/adam/test",
                        path: "/home/adam/test/long-split.css",
                        contents: new Buffer(data)
                    }));

                    fs.readFile('./test/css/long-split-blessed1.css', function(err, data){
                        if(err) throw new Error(err);

                        expectedSplits.push(new File({
                            cwd: "/home/adam/",
                            base: "/home/adam/test",
                            path: "/home/adam/test/long-split-blessed1.css",
                            contents: new Buffer(data)
                        }));

                        var index = 0, //expectedSplits.length - 1,
                            numberOfNewFiles = 0;

                        stream.on('data', function(newFile){
                            numberOfNewFiles++;

                            should.exist(newFile);
                            should.exist(newFile.path);
                            should.exist(newFile.relative);
                            should.exist(newFile.contents);

                            var expectedSplitFile = expectedSplits[index];
                            newFile.relative.should.equal(path.basename(expectedSplitFile.path));

                            var contents = newFile.contents.toString('utf8').replace(/\?z=[0-9]+'\)/g, "?z=xxx')");

                            contents.should.equal(expectedSplitFile.contents.toString('utf8'));
                            Buffer.isBuffer(newFile.contents).should.equal(true);
                            should.not.exist(newFile.sourceMap);
                            index++;
                        });

                        stream.on('end', function(){
                            numberOfNewFiles.should.equal(2);
                            done();
                        });

                        stream.write(longStylesheet);
                        stream.emit('end');
                    });
                });
            });
        });

        it('should use custom suffix if suffix option is set to a string', function(done){
            var suffix = "-part"
            var stream = bless({
                suffix: suffix
            });

            fs.readFile('./test/css/long.css', function(err, data){
                if(err) throw new Error(err); 

                var longStylesheet = new File({
                        cwd: "/home/adam/",
                        base: "/home/adam/test",
                        path: "/home/adam/test/long-split.css",
                        contents: new Buffer(data)
                });

                var actualSplits = []
                stream.on("data", function(newFile){
                    actualSplits.push(newFile);
                });

                stream.on("end", function(){
                    actualSplits.should.have.length(2);
                    var masterPart, subPart;
                    actualSplits.forEach(function(splittedFile){
                        should.exist(splittedFile);
                        should.exist(splittedFile.path);
                        should.exist(splittedFile.relative);
                        should.exist(splittedFile.contents);
                        if (path.basename(splittedFile.path) === "long-split.css") {
                            masterPart = splittedFile;
                        } else {
                            subPart = splittedFile;
                        }
                    });
                    should.exist(masterPart);
                    should.exist(subPart);
                    path.basename(subPart.path).should.equal("long-split" + suffix + "1.css");
                    var importRegex = "@import url\\('long-split" + suffix  + "1.css\\?z=[0-9]+'\\);";
                    masterPart.contents.toString("utf8").should.match(new RegExp(importRegex));
                    done();
                });

                stream.write(longStylesheet)  
                stream.emit("end")             
            });
        });

        it('should use custom suffix if suffix option is set to a function', function(done){
            var suffix = "-functionpart";
            var stream = bless({
                suffix: function(index) {
                    return suffix + "-" + index;
                }
            });

            fs.readFile('./test/css/long.css', function(err, data){
                if(err) throw new Error(err); 

                var longStylesheet = new File({
                        cwd: "/home/adam/",
                        base: "/home/adam/test",
                        path: "/home/adam/test/long-split.css",
                        contents: new Buffer(data)
                });

                var actualSplits = []
                stream.on("data", function(newFile){
                    actualSplits.push(newFile);
                });

                stream.on("end", function(){
                    actualSplits.should.have.length(2);
                    var masterPart, subPart;
                    actualSplits.forEach(function(splittedFile){
                        should.exist(splittedFile);
                        should.exist(splittedFile.path);
                        should.exist(splittedFile.relative);
                        should.exist(splittedFile.contents);
                        if (path.basename(splittedFile.path) === "long-split.css") {
                            masterPart = splittedFile;
                        } else {
                            subPart = splittedFile;
                        }
                    });
                    should.exist(masterPart);
                    should.exist(subPart);
                    path.basename(subPart.path).should.equal("long-split" + suffix + "-1.css");
                    var importRegex = "@import url\\('long-split" + suffix  + "-1.css\\?z=[0-9]+'\\);";
                    masterPart.contents.toString("utf8").should.match(new RegExp(importRegex));
                    done();
                });

                stream.write(longStylesheet)  
                stream.emit("end")             
            });
        });

        it('should throw error if suffix option is neither string nor function', function(done){ 

            (function callBlessWithInvalidSuffix() {
                gulp.src('./test/css/long.css')
                    .pipe(bless({suffix:{}}))
            }).should.throw(/.*suffix.*string.*function.*/);
            done();
        });

        it('should apply sourcemaps', function(done){
            var expectedSplits = [
                new File({
                    cwd: "/home/test/",
                    base: "/home/test/css",
                    path: "/home/test/css/long-split.css",
                    contents: new Buffer(fs.readFileSync('./test/css/long-split.css').toString('utf8'))
                }),
                new File({
                    cwd: "/home/test/",
                    base: "/home/test/css",
                    path: "/home/test/css/long-split-blessed1.css",
                    contents: new Buffer(fs.readFileSync('./test/css/long-split-blessed1.css').toString('utf8'))
                })
            ];

            gulp.src('./test/css/long.css')
                .pipe($.rename({
                    suffix: '-split'
                }))
                .pipe($.sourcemaps.init())
                .pipe(bless())
                .pipe(assert.length(2))
                .pipe(assert.first(function(result) {
                    path.relative('./', result.path).should.equal(path.relative('/home', expectedSplits[0].path));
                    result.contents.toString('utf8')
                        .replace(/\?z=[0-9]+'\)/g, "?z=xxx')")
                        .should.equal(expectedSplits[0].contents.toString('utf8'));

                    result.sourceMap.sources.should.have.length(1);
                    result.sourceMap.sources[0].should.match(/long-split\.css$/);
                    result.sourceMap.file.should.equal(path.basename(expectedSplits[0].path));
                    result.sourceMap.mappings.should.equal(
                        fs.readFileSync('./test/css/long-split.map').toString('utf8')
                    );
                }))
                .pipe(assert.second(function(result) {
                    path.relative('./', result.path).should.equal(path.relative('/home', expectedSplits[1].path));
                    result.contents.toString('utf8').should.equal(expectedSplits[1].contents.toString('utf8'));

                    result.sourceMap.sources.should.have.length(1);
                    result.sourceMap.sources[0].should.match(/long-split\.css$/);
                    result.sourceMap.file.should.equal(path.basename(expectedSplits[1].path));
                    result.sourceMap.mappings.should.equal(
                        fs.readFileSync('./test/css/long-split-blessed1.map').toString('utf8')
                    );
                }))
                .pipe(assert.end(done));
        });

        /* Issue 36 test */
        it('should apply sourcemaps correctly for no split', function(done) {      
            var testFileName = './test/css/small.css';
            var concatName = 'small.contacted.css';
            var mappingsDir = 'generated-sourcemaps';
            gulp.src(testFileName)
                .pipe($.sourcemaps.init())
                .pipe(concat(concatName))
                .pipe(bless())
                .pipe(cleanCss({processImport: false}))
                .pipe($.sourcemaps.write(mappingsDir))
                .pipe(assert.length(2))
                .pipe(assert.nth(0, function(result){
                    result.relative.should.equal(path.join(mappingsDir, concatName) + '.map');
                    var mappingData = JSON.parse(result.contents.toString('utf8'));
                    mappingData.version.should.equal(3);
                    mappingData.names.should.be.empty();
                    mappingData.sources.should.deepEqual([concatName]);
                    mappingData.mappings.should.equal('AAAA,OAAO,UAAA');
                    mappingData.file.should.equal('../' + concatName);
                    mappingData.sourcesContent.should.deepEqual(['.small{font-size: 10px}']);
                }))
                .pipe(assert.nth(1, function(result) {
                    result.relative.should.equal(concatName);
                    var minifiedCssRegex = '\\.small{font-size:10px}[^]+sourceMappingURL=' + mappingsDir + '/' + concatName + '\\.map[^]*';
                    result.contents.toString('utf8').should.match(new RegExp(minifiedCssRegex));
                }))
                .pipe(assert.end(done));
        });

        it('should apply sourcemaps correctly when there already is a sourcemap', function(done){
            var expectedSplits = [
                new File({
                    cwd: "/home/test/",
                    base: "/home/test/css",
                    path: "/home/test/css/long-split.css",
                    contents: new Buffer(fs.readFileSync('./test/css/long-split-with-sourcemap-comment.css').toString('utf8'))
                }),
                new File({
                    cwd: "/home/test/",
                    base: "/home/test/css",
                    path: "/home/test/css/long-split-blessed1.css",
                    contents: new Buffer(fs.readFileSync('./test/css/long-split-blessed1-with-sourcemap-comment.css').toString('utf8'))
                })
            ];

            //note that for each assert that reads large file, we will provide custom error message to speed up the test execution 
            //shall there be any failure.
            gulp.src('./test/css/long.css')
                .pipe($.rename({
                    suffix: '-split'
                }))
                .pipe($.sourcemaps.init())
                .pipe(concat("long-split.css")) //concat will produce a source mapping
                .pipe(bless())
                .pipe($.sourcemaps.write('./generated-sourcemaps'))
                .pipe(assert.length(4))
                .pipe(assert.nth(0, function(result) {
                    result.path.should.match(/long-split\.css\.map$/);
                    var expectedValueFile = './test/css/long-split-with-pre-existing-sourcemap.map';
                    result.contents.toString('utf8').should.equal(
                        fs.readFileSync(expectedValueFile).toString('utf8'),
                        "first split source map does not contain expected content as contained in " + expectedValueFile
                    );
                }))
                .pipe(assert.nth(1, function(result) {
                    path.relative('./', result.path).should.equal(path.relative('/home', expectedSplits[0].path));
                    result.contents.toString('utf8')
                        .replace(/\?z=[0-9]+'\)/g, "?z=xxx')")
                        .should.equal(expectedSplits[0].contents.toString('utf8'));

                    result.sourceMap.sources.should.have.length(1);
                    result.sourceMap.sources[0].should.match(/long-split\.css$/);
                    result.sourceMap.file.should.equal('../' + path.basename(expectedSplits[0].path));
                    var expectedValueFile = './test/css/long-split.map';
                    result.sourceMap.mappings.should.equal(
                        fs.readFileSync(expectedValueFile).toString('utf8'),
                        "first split does not contain correcing source map mapping as contained in " + expectedValueFile
                    );
                }))
                .pipe(assert.nth(2, function(result) {
                    result.path.should.match(/long-split-blessed1\.css\.map$/);
                    var expectedValueFile = './test/css/long-split-blessed1-with-pre-existing-sourcemap.map';
                    result.contents.toString('utf8').should.match(
                        fs.readFileSync(expectedValueFile).toString('utf8'),
                         "second split source map does not contain expected content as contained in " + expectedValueFile
                    );
                }))
                .pipe(assert.nth(3, function(result) {
                    path.relative('./', result.path).should.equal(path.relative('/home', expectedSplits[1].path));
                    result.contents.toString('utf8').should.equal(expectedSplits[1].contents.toString('utf8'));

                    result.sourceMap.sources.should.have.length(1);
                    result.sourceMap.sources[0].should.match(/long-split\.css$/);
                    result.sourceMap.file.should.equal('../' + path.basename(expectedSplits[1].path));
                    var expectedValueFile = './test/css/long-split-blessed1.map';
                    result.sourceMap.mappings.should.equal(
                        fs.readFileSync(expectedValueFile).toString('utf8'),
                        "second split does not contain correcing source map mapping as contained in " + expectedValueFile
                    );
                }))
                .pipe(assert.end(done));
        });


        it("shouldn't add parameters to @imports if the cacheBuster option is false", function(done){
            var stream = bless({
                cacheBuster: false
            });

            fs.readFile('./test/css/long.css', function(err, data){
                if(err) throw new Error(err);

                var longStylesheet = new File({
                        cwd: "/home/adam/",
                        base: "/home/adam/test",
                        path: "/home/adam/test/long-split.css",
                        contents: new Buffer(data)
                    }),
                    expectedSplits = [];

                fs.readFile('./test/css/long-split--no-cache-buster.css', function(err, data){
                    if(err) throw new Error(err);

                    expectedSplits.push(new File({
                        cwd: "/home/adam/",
                        base: "/home/adam/test",
                        path: "/home/adam/test/long-split.css",
                        contents: new Buffer(data)
                    }));

                    fs.readFile('./test/css/long-split-blessed1.css', function(err, data){
                        if(err) throw new Error(err);

                        expectedSplits.push(new File({
                            cwd: "/home/adam/",
                            base: "/home/adam/test",
                            path: "/home/adam/test/long-split-blessed1.css",
                            contents: new Buffer(data)
                        }));

                        var index = 0, //expectedSplits.length - 1,
                            numberOfNewFiles = 0;

                        stream.on('data', function(newFile){
                            numberOfNewFiles++;

                            should.exist(newFile);
                            should.exist(newFile.path);
                            should.exist(newFile.relative);
                            should.exist(newFile.contents);

                            var expectedSplitFile = expectedSplits[index];
                            newFile.relative.should.equal(path.basename(expectedSplitFile.path));

                            var contents = newFile.contents.toString('utf8');

                            contents.should.equal(expectedSplitFile.contents.toString('utf8'));
                            Buffer.isBuffer(newFile.contents).should.equal(true);
                            index++;
                        });

                        stream.on('end', function(){
                            numberOfNewFiles.should.equal(2);
                            done();
                        });

                        stream.write(longStylesheet);
                        stream.emit('end');
                    });
                });
            });
        });


        it("shouldn't add @imports if imports option is false", function(done){
            var stream = bless({
                imports: false
            });

            fs.readFile('./test/css/long.css', function(err, data){
                if(err) throw new Error(err);

                var longStylesheet = new File({
                        cwd: "/home/adam/",
                        base: "/home/adam/test",
                        path: "/home/adam/test/long-split.css",
                        contents: new Buffer(data)
                    }),
                    expectedSplits = [];

                fs.readFile('./test/css/long-split--no-imports.css', function(err, data){
                    if(err) throw new Error(err);

                    expectedSplits.push(new File({
                        cwd: "/home/adam/",
                        base: "/home/adam/test",
                        path: "/home/adam/test/long-split.css",
                        contents: new Buffer(data)
                    }));

                    fs.readFile('./test/css/long-split-blessed1.css', function(err, data){
                        if(err) throw new Error(err);

                        expectedSplits.push(new File({
                            cwd: "/home/adam/",
                            base: "/home/adam/test",
                            path: "/home/adam/test/long-split-blessed1.css",
                            contents: new Buffer(data)
                        }));

                        var index = 0, //expectedSplits.length - 1,
                            numberOfNewFiles = 0;

                        stream.on('data', function(newFile){
                            numberOfNewFiles++;

                            should.exist(newFile);
                            should.exist(newFile.path);
                            should.exist(newFile.relative);
                            should.exist(newFile.contents);

                            var expectedSplitFile = expectedSplits[index];
                            newFile.relative.should.equal(path.basename(expectedSplitFile.path));

                            var contents = newFile.contents.toString('utf8').replace(/\?z=[0-9]+'\)/g, "?z=xxx')");

                            contents.should.equal(expectedSplitFile.contents.toString('utf8'));
                            Buffer.isBuffer(newFile.contents).should.equal(true);
                            index++;
                        });

                        stream.on('end', function(){
                            numberOfNewFiles.should.equal(2);
                            done();
                        });

                        stream.write(longStylesheet);
                        stream.emit('end');
                    });
                });
            });
        });


        it('should return empty file if empty files are passed', function(done){
            var stream = bless();

            var stylesheetA = new File({
                cwd: "/home/adam/",
                base: "/home/adam/test",
                path: "/home/adam/test/file.css",
                contents: new Buffer("")
            });

            var stylesheetB = new File({
                cwd: "/home/adam/",
                base: "/home/adam/test",
                path: "/home/adam/test/file.css",
                contents: new Buffer("")
            });

            var numberOfNewFiles = 0;

            stream.on('data', function(newFile){
                numberOfNewFiles++;
                should.exist(newFile);
                should.exist(newFile.path);
                should.exist(newFile.relative);
                should.exist(newFile.contents);

                newFile.relative.should.equal('file.css');
                newFile.contents.toString('utf8').should.equal('');
                Buffer.isBuffer(newFile.contents).should.equal(true);
            });

            stream.on('end', function(){
                numberOfNewFiles.should.equal(2);
                done();
            });

            stream.write(stylesheetA);
            stream.write(stylesheetB);
            stream.end();
        });


        it('should throw an error if stream is passed', function(done){
            var stream = bless();

            stream.on('error', function(err){
                err.plugin.should.equal('gulp-bless');
                err.message.should.equal('Streaming not supported');
                done();
            });

            stream.write(new File({
                path: 'a',
                base: 'a',
                cwd: 'a',
                contents: fs.createReadStream('./test/css/long.css')
            }));
            stream.end();
        });


        it("shouldn't throw error if options are passed", function(done){
            var stream = bless({
                hello: 'world'
            });
            var numberOfErrors = 0;

            stream.on('error', function(){
                numberOfErrors++
            });

            stream.on('end', function(){
               numberOfErrors.should.be.equal(0);
               done();
            });

            stream.write(new File({
                path: 'style.css',
                contents: new Buffer('p {color:red;}')
            }));
            stream.emit('end');
        });


        it("should work if file doesn't end with .css", function(done){
            var stream = bless();
            var fileContents = 'p {color:red}';
            var numberOfFiles = 0;
            var numberOfErrrors = 0;

            stream.on('error', function(){
                numberOfErrrors++;
            });

            stream.on('data', function(file){
                file.contents.toString().should.be.equal('p {\n  color: red;\n}');
                path.basename(file.path).should.be.equal('style.xml');
                numberOfFiles++;
            });

            stream.on('end', function(){
                numberOfErrrors.should.be.equal(0);
                numberOfFiles.should.be.equal(1);
                done();
            });

            stream.write(new File({
                base: '/test/',
                cwd: '/test/a/',
                path: '/test/a/style.xml',
                contents: new Buffer(fileContents)
            }));
            stream.emit('end');
        });


        it("should work if file doesn't contain an extension", function(done){
            var stream = bless();
            var fileContents = 'p {color:red}';
            var numberOfFiles = 0;
            var numberOfErrrors = 0;

            stream.on('error', function(){
                numberOfErrrors++;
            });

            stream.on('data', function(file){
                file.contents.toString().should.be.equal('p {\n  color: red;\n}');
                path.basename(file.path).should.be.equal('style');
                numberOfFiles++;
            });

            stream.on('end', function(){
                numberOfErrrors.should.be.equal(0);
                numberOfFiles.should.be.equal(1);
                done();
            });

            stream.write(new File({
                base: '/test/',
                cwd: '/test/a/',
                path: '/test/a/style',
                contents: new Buffer(fileContents)
            }));
            stream.emit('end');
        });


        it("shouldn't concatenate files", function(done){
            var stream = bless();
            var numberOfFiles = 0;
            var numberOfErrrors = 0;

            var fileA = new File({
                base: '/test/',
                cwd: '/test/a/',
                path: '/test/a/abc.css',
                contents: new Buffer('p {\n  color: red;\n}')
            });

            var fileB = new File({
                base: '/test/',
                cwd: '/test/a/',
                path: '/test/a/def.css',
                contents: new Buffer('a {\n  color: blue;\n}')
            });

            stream.on('error', function(){
                numberOfErrrors++;
            });

            stream.on('data', function(file){
                if(numberOfFiles){
                    file.contents.toString().should.be.equal(fileB.contents.toString());
                    file.path.should.be.equal(path.resolve(fileB.path));
                }
                else {
                    file.contents.toString().should.be.equal(fileA.contents.toString());
                    file.path.should.be.equal(path.resolve(fileA.path));
                }
                numberOfFiles++;
            });

            stream.on('end', function(){
                numberOfErrrors.should.be.equal(0);
                numberOfFiles.should.be.equal(2);
                done();
            });

            stream.write(fileA);
            stream.write(fileB);
            stream.emit('end');
        });


        it("should log using gulp-util when option is enabled", function(done){
            var gulpBless = mockrequire('../index', {
                'gulp-util': {
                    log: function(text){
                        text.should.equal('Found 1 selector, not splitting.');
                        done();
                    }
                }
            });

            var stream = gulpBless({
                log: true
            });

            stream.write(new File({
                cwd: "/home/adam/",
                base: "/home/adam/test",
                path: "/home/adam/test/file.css",
                contents: new Buffer("a { color: red; }")
            }));

            stream.end();
        });

         it("should log file splitted for large css", function(done){
            var gulpBless = mockrequire('../index', {
                'gulp-util': {
                    log: function(text){
                        text.should.equal('Found 4096 selectors, splitting into 2 blessedFiles.');
                        done();
                    }
                }
            });

            var stream = gulpBless({
                log: true
            });
            fs.readFile('./test/css/long.css', function(err, data){
                if(err) throw new Error(err);

                stream.write(new File({
                    cwd: "/home/adam/",
                    base: "/home/adam/test",
                    path: "/home/adam/test/file.css",
                    contents: new Buffer(data)
                }));

                stream.end();
            });
        });



        it("should not log using gulp-util when option isn't true", function(done) {
            var gulpBless = mockrequire('../index', {
                'gulp-util': {
                    log: function (text) {
                        should.fail(null, null, "gulp-util.log shouldn't have been called");
                    }
                }
            });

            var stream = gulpBless();

            stream.on('data', function(){});
            stream.on('end', function(){
                done();
            });

            stream.write(new File({
                cwd: "/home/adam/",
                base: "/home/adam/test",
                path: "/home/adam/test/file.css",
                contents: new Buffer("a { color: red; }")
            }));

            stream.end();
        });
    });
});