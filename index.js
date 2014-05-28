'use strict';

var through = require('through');
var os = require('os');
var path = require('path');
var bless = require('bless');
var gutil = require('gulp-util');
var File = gutil.File;
var PluginError = gutil.PluginError;

module.exports = function(options){
    var pluginName = 'gulp-bless';

    options = options || {};

    function bufferContents(file, encoding, cb){
        if (file.isNull()) return; // ignore
        if (file.isStream()) return this.emit('error', new PluginError(pluginName,  'Streaming not supported'));
        var stream = this;

        if(file.contents){
            var fileName = path.basename(file.path);
            var outputFilePath = path.resolve(path.dirname(file.path), fileName);
            var contents = file.contents.toString('utf8');

            new (bless.Parser)({
                output: outputFilePath,
                options: options
            }).parse(contents, function (err, blessedFiles, numSelectors) {
                    if (err) {
                        throw new PluginError(pluginName, err);
                    }

                    // print log message
                    var msg = 'Found ' + numSelectors + ' selector' + (numSelectors === 1 ? '' : 's') + ', ';
                    if (blessedFiles.length > 1) {
                        msg += 'splitting into ' + blessedFiles.length + ' blessedFiles.';
                    } else {
                        msg += 'not splitting.';
                    }
                    console.log(msg);

                    // write processed file(s)
                    blessedFiles.forEach(function (blessedFile) {
                        stream.emit('data', new File({
                            cwd: file.cwd,
                            base: file.base,
                            path: path.resolve(blessedFile.filename),
                            contents: new Buffer(blessedFile.content)
                        }));
                    });
                });
        }
        else {
            cb(file, null);
        }
    }

    function endStream(){
        this.emit('end');
    }

    return through(bufferContents, endStream);
};