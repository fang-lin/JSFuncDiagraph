/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */
(function () {
    'use strict';

    var express = require('express'),
        compression = require('compression'),
        errorhandler = require('errorhandler'),
        morgan = require('morgan'),
        send = require('send'),
        config = require('./config');

    var app = express();

    var sendIndex = function (req, res) {
        send(req, config.client + '/index.html').pipe(res);
    };

    if (config.development()) {

        app.use(express.static(config.client));
        app.use(morgan(config.morgan));
        app.use(sendIndex);

        app.listen(config.port, function () {
            console.log('[server]', '[express]', 'Http server listening on port', config.port);
        });

    } else {

        app.use(errorhandler());
        app.use(compression());
        app.use(express.static(config.dist));
        app.use(morgan(config.morgan));
        app.use(sendIndex);

        app.listen(config.port, function () {
            console.log('[server]', '[express]', 'Http server listening on port', config.port);
        });
    }
})();

