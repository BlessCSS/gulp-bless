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
            var stream = bless('styles.css');

            stream.on('data', function(newFile){
                should.exist(newFile);
                should.exist(newFile.path);
                should.exist(newFile.relative);
                should.exist(newFile.contents);

                newFile.relative.should.equal('styles.css');
                String(newFile.contents).should.equal('p {color:red}');
                Buffer.isBuffer(newFile.contents).should.equal(true);
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

                            newFile.relative.should.equal('long-split' + (index > 0 ? '-blessed' + index : '')  + '.css');
                            String(newFile.contents).should.equal(expectedSplits[index].contents.toString());
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
    });
});