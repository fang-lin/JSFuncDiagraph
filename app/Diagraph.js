/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

(function () {
    function Diagraph($wrap, size) {
        this.$wrap = $wrap;
        this.expressions = [];

        var $grid = this.createLayer('grid');
        this.$wrap.append($grid);
        this.grid = $grid[0].getContext('2d');

        var $axis = this.createLayer('axis');
        this.$wrap.append($axis);
        this.axis = $axis[0].getContext('2d');

        this._zoom = 16;
        this.size(size);
        this.origin(0);
        this.range();
    }

    Diagraph.MIN_DELTA = 1e-7;
    Diagraph.CHORD_FIELD = [.9, 1.1];
    Diagraph.MAX_ITERATION = 10000000000000;
    Diagraph.MAX_DELTA_RECOUNT = 10;
    Diagraph.ZOOM_RANGE = [2, 500];
    Diagraph.AXIS_COLOR = '#666';
    Diagraph.GRID_COLOR = '#eee';

    var _prototype_ = Diagraph.prototype;

    _prototype_.createLayer = function (className) {
        return $('<canvas class="' + className + '"/>');
    };

    _prototype_.range = function (origin, zoom) {
        var size = this.size();
        var offset = origin || this._origin;
        var _zoom = zoom || this._zoom;
        this._range = [
                -offset[0] / _zoom,
                offset[1] / _zoom,
                (size[0] - offset[0]) / _zoom,
                (offset[1] - size[1]) / _zoom
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

    _prototype_.drawAxis = function () {
        var context = this.axis;
        var origin = this._origin;
        var size = this.size();

        context.beginPath();
        context.moveTo(0, origin[1]);
        context.lineTo(size[0], origin[1]);
        context.moveTo(origin[0], 0);
        context.lineTo(origin[0], size[1]);
        context.strokeStyle = Diagraph.AXIS_COLOR;
        context.stroke();
        return this;
    };

    _prototype_.drawGrid = function () {
        var context = this.grid;
        var origin = this._origin;
        var size = this.size();
        var zoom = this._zoom;

        context.beginPath();
        var x = origin[0] % zoom - zoom;
        while (x < size[0]) {
            x += zoom;
            context.moveTo(x, 0);
            context.lineTo(x, size[1]);
        }
        var y = origin[1] % zoom - zoom;
        while (y < size[1]) {
            y += zoom;
            context.moveTo(0, y);
            context.lineTo(size[0], y);
        }
        context.strokeStyle = Diagraph.GRID_COLOR;
        context.stroke();
        return this;
    };

    _prototype_.size = function (size) {
        if (size) {
            this.$wrap.attr('width', size[0]).attr('height', size[1])
                .find('canvas').attr('width', size[0]).attr('height', size[1]);
            return this;
        } else {
            return [
                this.$wrap.width(),
                this.$wrap.height()
            ];
        }
    };

    _prototype_.zoom = function (zoom) {
        if (zoom) {
            var ZOOM_RANGE = Diagraph.ZOOM_RANGE;
            if (zoom >= ZOOM_RANGE[0] && zoom <= ZOOM_RANGE[1]) {
                this._zoom = zoom;
            }
            return this;
        } else {
            return this._zoom;
        }
    };

    _prototype_.pushExpression = function (expression) {
        if (typeof expression.func === 'function' && typeof expression.color === 'string') {
            var $canvas = this.createLayer('expression');
            this.$wrap.append($canvas);
            expression.canvas = $canvas[0].getContext('2d');
            this.expressions.push(expression);
        }
        return this;
    };

    _prototype_.drawExpression = function (expression) {


        var worker = new Worker('app/drawExpression.js');
        worker.postMessage({
            color: expression.color,
            literal: expression.literal
        });

        worker.addEventListener('message', function () {

        });

        var func = expression.func;
        var color = expression.color;
        var context = expression.canvas;
        var range = this._range;
        var offset = this._origin;
        var zoom = this._zoom;

        var CHORD_FIELD = Diagraph.CHORD_FIELD;
        var MAX_ITERATION = Diagraph.MAX_ITERATION;
        var MAX_DELTA_RECOUNT = Diagraph.MAX_DELTA_RECOUNT;
        var MIN_DELTA = Diagraph.MIN_DELTA;
        var MAX_DELTA = (CHORD_FIELD[0] + CHORD_FIELD[1]) / 2 / zoom;

        context.fillStyle = color;
        var x = range[0], y = null;
        var dx = MAX_DELTA;

        var px, py;

        var maxDeltaRecount = 0;
        var pointCount = 0;
        var iterationCount = 0;
//        var startTime = new Date();
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

    _prototype_.drawParametricExpression = function (expression) {
        //todo: drawParametricExpression
    };

    _prototype_.drawExpressions = function () {
        var self = this;
        this.expressions.forEach(function (expression) {
            if (expression.domin) {
                self.drawParametricExpression(expression);
            } else {
                self.drawExpression(expression);
            }
        });
    };

    _prototype_.erasure = function () {
        var size = this.size();
        this.$wrap.find('canvas')
            .attr('width', 0).attr('height', 0)
            .attr('width', size[0]).attr('height', size[1]);
        return this;
    };

    _prototype_.redraw = function (size, origin) {
        this.size(size);
        this.origin(origin);
        return this
            .range()
            .erasure()
            .drawGrid()
            .drawAxis()
            .drawExpressions();
    };

    window.Diagraph = Diagraph;
})();