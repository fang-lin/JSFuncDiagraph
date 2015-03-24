#!/usr/bin/env node

var exec = require('child_process').exec;

exec('gulp lint', function (err, stdout, stderr) {
    console.info(stdout);
    var exitCode = 0;
    if (err) {
        console.error(stderr);
        exitCode = -1;
    }
    process.exit(exitCode);
});