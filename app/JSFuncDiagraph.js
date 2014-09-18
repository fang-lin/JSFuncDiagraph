/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

(function () {
    function JSFuncDiagraph($canvas, size) {
        this.$canvas = $canvas;
        this.context = this.$canvas[0].getContext('2d');
        this.funExpressions = [];

        this._zoom = 10;
        this.size(size);
        this.origin(0);
        this.range();
    }

    JSFuncDiagraph.MIN_DELTA = 1e-7;
    JSFuncDiagraph.CHORD_FIELD = [.9, 1.1];
    JSFuncDiagraph.MAX_ITERATION = 10000000000000;
    JSFuncDiagraph.MAX_DELTA_RECOUNT = 10;
    JSFuncDiagraph.ZOOM_RANGE = [2, 200];

    var _prototype_ = JSFuncDiagraph.prototype;

    _prototype_.range = function (origin, zoom) {
        var size = this.size();
        var offset = origin || this._origin;
        var zoom = zoom || this._zoom;
        this._range = [
                -offset[0] / zoom,
                offset[1] / zoom,
                (size[0] - offset[0]) / zoom,
                (offset[1] - size[1]) / zoom
        ];
        return this;
    };

    _prototype_.origin = function (origin) {
        var size = this.size();
        if (origin === 0) {
            this._origin = [size[0] / 2, size[1] / 2];
            return this;
        } else if (origin) {
            this._origin = origin;
            return this;
        } else {
            return this._origin;
        }
    };

    _prototype_.size = function (size) {
        if (size) {
            this.$canvas
                .attr('width', size[0])
                .attr('height', size[1]);
            return this;
        } else {
            return [
                this.$canvas.width(),
                this.$canvas.height()
            ];
        }
    };

    _prototype_.zoom = function (zoom) {
        if (zoom) {
            var ZOOM_RANGE = JSFuncDiagraph.ZOOM_RANGE;
            if (zoom > ZOOM_RANGE[0] && zoom < ZOOM_RANGE[1]) {
                this._zoom = zoom;
            }
            return this;
        } else {
            return this._zoom;
        }
    };

    _prototype_.pushExpression = function (expression) {
        this.funExpressions.push(expression);
        return this;
    };

    _prototype_.drawExpression = function (expression) {

        var func = expression.func;
        var color = expression.color;
        var context = this.context;
        var range = this._range;
        var offset = this._origin;
        var zoom = this._zoom;

        var CHORD_FIELD = JSFuncDiagraph.CHORD_FIELD;
        var MAX_ITERATION = JSFuncDiagraph.MAX_ITERATION;
        var MAX_DELTA_RECOUNT = JSFuncDiagraph.MAX_DELTA_RECOUNT;
        var MIN_DELTA = JSFuncDiagraph.MIN_DELTA;
        var MAX_DELTA = (CHORD_FIELD[0] + CHORD_FIELD[1]) / 2 / zoom;

        context.fillStyle = color;
        var x = range[0], y;
        var dx = MAX_DELTA;

        var px, py;

        var maxDeltaRecount = 0;
        var pointCount = 0;
        var iterationCount = 0;
        var startTime = new Date();
        do {
            if (Number.isFinite(y)) {
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

                context.fillRect(px, py, 1, 1);
                pointCount++;
            }

            iterationCount++;

        } while (x < range[2] && iterationCount < MAX_ITERATION);
        var endTime = new Date();

//        console.log('pointCount: ', pointCount);
//        console.log('iterationCount: ', iterationCount);
//        console.log('maxDeltaRecount: ', maxDeltaRecount);
//        console.log('time: ', endTime.getTime() - startTime.getTime());
    };

    _prototype_.drawExpressions = function (size) {
        var self = this;
        this.erasure();
        this.funExpressions.forEach(function (expression) {
            self.drawExpression(expression);
        });
    };

    _prototype_.erasure = function () {
        var size = this.size();
        this.context.fillStyle = '#fff';
        this.context.fillRect(0, 0, size[0], size[1]);
    };

    _prototype_.redraw = function (size, origin) {
        if (size) {
            this.size(size);
        }
        if (origin) {
            this.origin(origin);
        }
        return this
            .range()
            .drawExpressions();
    };

    window.JSFuncDiagraph = JSFuncDiagraph;
})();