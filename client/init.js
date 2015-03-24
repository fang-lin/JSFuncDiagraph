/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

requirejs.config({
    paths: {
        // Libs
        'jquery': 'lib/jquery/dist/jquery',
        'jquery.mousewheel': 'lib/jquery-mousewheel/jquery.mousewheel',
        'underscore': 'lib/underscore/underscore',
        'lz-string': 'lib/lz-string/libs/lz-string',
        'catiline': 'lib/catiline/dist/catiline',
        'page': 'lib/page/page',
        // Apps
        'app': 'app/app',
        'Diagraph': 'app/Diagraph',
        'Expression': 'app/Expression',
        'Palette': 'app/Palette'
    },
    shim: {
        'jquery.mousewheel': {
            deps: ['jquery']
        }
    }
});

require(['app']);