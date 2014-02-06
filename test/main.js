var bless = require('../');
var should = require('should');
var os = require('os');
var fs = require('fs');
var path = require('path');
var File = require('gulp-util').File;
var Buffer = require('buffer').Buffer;
require('mocha');

describe('gulp-bless', function() {
    describe('bless()', function() {

        it('should do nothing if under the limit', function(done){
            var stream = bless('styles.css'),
                numberOfNewFiles = 0;

            stream.on('data', function(newFile){
                numberOfNewFiles++;

                should.exist(newFile);
                should.exist(newFile.path);
                should.exist(newFile.relative);
                should.exist(newFile.contents);

                newFile.relative.should.equal('styles.css');
                newFile.contents.toString('utf8').should.equal('p {color:red}');
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
            stream.end();
        });

        it('should split when selector count is over the limit', function(done){
            var stream = bless('long-split.css');

            fs.readFile('./test/css/long.css', function(err, data){
                if(err) throw new Error(err);

                var longStylesheet = new File({
                        cwd: "/home/adam/",
                        base: "/home/adam/test",
                        path: "/home/adam/test/long.css",
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

                        var index = expectedSplits.length - 1,
                            numberOfNewFiles = 0;

                        stream.on('data', function(newFile){
                            numberOfNewFiles++;

                            should.exist(newFile);
                            should.exist(newFile.path);
                            should.exist(newFile.relative);
                            should.exist(newFile.contents);

                            var expectedSplitFile = expectedSplits[index];
                            newFile.relative.should.equal(path.basename(expectedSplitFile.path));
                            newFile.contents.toString('utf8').should.equal(expectedSplitFile.contents.toString('utf8'));
                            Buffer.isBuffer(newFile.contents).should.equal(true);
                            index--;
                        });

                        stream.on('end', function(){
                            numberOfNewFiles.should.equal(2);
                            done();
                        });

                        stream.write(longStylesheet);
                        stream.end();
                    });
                });
            });
        });

        it('should include every file passed (by concatenating them first)', function(done){
            var stream = bless('styles.css');

            var stylesheetA = new File({
                cwd: "/home/adam/",
                base: "/home/adam/test",
                path: "/home/adam/test/file.css",
                contents: new Buffer("p {color:red}")
            });

            var stylesheetB = new File({
                cwd: "/home/adam/",
                base: "/home/adam/test",
                path: "/home/adam/test/file.css",
                contents: new Buffer("li:hover {display: block;}")
            });

            var expectedCSS = stylesheetA.contents.toString('utf8') + stylesheetB.contents.toString('utf8'),
                numberOfNewFiles = 0;

            stream.on('data', function(newFile){
                numberOfNewFiles++;
                should.exist(newFile);
                should.exist(newFile.path);
                should.exist(newFile.relative);
                should.exist(newFile.contents);

                newFile.relative.should.equal('styles.css');
                newFile.contents.toString('utf8').should.equal(expectedCSS);
                Buffer.isBuffer(newFile.contents).should.equal(true);
            });

            stream.on('end', function(){
                numberOfNewFiles.should.equal(1);
                done();
            });

            stream.write(stylesheetA);
            stream.write(stylesheetB);
            stream.end();
        });
    });
});