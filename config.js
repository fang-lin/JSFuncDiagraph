/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

module.exports = {
    morgan: 'short',
    client: 'client',
    dist: 'dist',
    port: process.env.PORT || 8080,
    development: function () {
        var nodeEnv = process.env.NODE_ENV || '';
        return ['dev', 'development'].indexOf(nodeEnv.toLowerCase()) !== -1;
    }
};