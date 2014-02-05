var through = require('through');
var os = require('os');
var path = require('path');
var gutil = require('gulp-util');
var File = gutil.File;
var PluginError = gutil.PluginError;

module.exports = function(){
    var pluginName = 'gulp-bless';

    function bufferContents(file){
        if (file.isNull()) return; // ignore
        if (file.isStream()) return this.emit('error', new PluginError(pluginName,  'Streaming not supported'));

        this.push(file);
    }

    function endStream(){

        this.emit('end');
    }

    return through(bufferContents, endStream);
};