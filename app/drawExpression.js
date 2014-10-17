/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

function drawExpression(data) {

    var func = new Function('x', 'return ' + data.literal + ';');
    var zoom = data.zoom;
    var CHORD_FIELD = data.CHORD_FIELD;
    var MIN_DELTA = data.MIN_DELTA;
    var MAX_DELTA_RECOUNT = data.MAX_DELTA_RECOUNT;
    var MAX_ITERATION = data.MAX_ITERATION;
    var MAX_DELTA = (CHORD_FIELD[0] + CHORD_FIELD[1]) / 2 / zoom;
    var range = data.range;
    var offset = data.offset;

    var x = range[0], y = null;
    var dx = MAX_DELTA;

    var px, py;

    var maxDeltaRecount = 0;
    var pointCount = 0;
    var iterationCount = 0;

    do {
        if (Math.abs(y) < Number.MAX_VALUE) {
            var deltaRecount = 0;
            do {
                var dy = y - func(x + dx);
                var chord = Math.pow(Math.pow(dx, 2) + Math.pow(dy, 2), .5);

                if (chord * zoom > CHORD_FIELD[0] && chord * zoom < CHORD_FIELD[1]) {
                    break;
                } else {
                    dx = Math.cos(Math.atan(dy / dx)) / zoom;
                }

                if (dx < MIN_DELTA) {
                    dx = MIN_DELTA;
                    break;
                }

                deltaRecount++;
            } while (deltaRecount < MAX_DELTA_RECOUNT);

            if (deltaRecount > maxDeltaRecount) {
                maxDeltaRecount = deltaRecount;
            }
        } else {
            dx = MAX_DELTA;
        }

        x += dx;
        y = func(x);

        if (y > range[3] && y < range[1]) {
            px = offset[0] + x * zoom;
            py = offset[1] - y * zoom;

            postMessage({x: px, y: py});
            pointCount++;
        }

        iterationCount++;

    } while (x < range[2] && iterationCount < MAX_ITERATION);
    postMessage(null);
}

addEventListener('message', function (msg) {
    drawExpression(msg.data);
}, false);