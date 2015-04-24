/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

requirejs.config({
    paths: {
        // Libs
        'jquery': 'lib/jquery/dist/jquery',
        'jquery.mousewheel': 'lib/jquery-mousewheel/jquery.mousewheel',
        'jquery.browser': 'lib/jquery.browser/dist/jquery.browser',
        'underscore': 'lib/underscore/underscore',
        'lz-string': 'lib/lz-string/libs/lz-string',
        'catiline': 'lib/catiline/dist/catiline',
        'backbone': 'lib/backbone/backbone',
        // Apps
        'app': 'app/app',
        'example': 'app/example',
        'Diagraph': 'app/Diagraph',
        'Expression': 'app/Expression',
        'Palette': 'app/Palette',
        'parser': 'app/parser'
    },
    shim: {
        'jquery.mousewheel': {
            deps: ['jquery']
        },
        'jquery.browser': {
            deps: ['jquery']
        },
        'backbone': {
            deps: ['underscore']
        }
    }
});

require(['app']);