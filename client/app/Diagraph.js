/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

define([
    'Expression',
    '../lib/catiline/dist/catiline'
], function (Expression, cw) {
    'use strict';

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
        this.initDrawingWorker(8);

        this._events = {};
    }

    Diagraph.MIN_DELTA = 1e-7;
    Diagraph.MAX_VALUE = 1e100;
    Diagraph.CHORD_FIELD = [0.9, 1.1];
    Diagraph.MAX_ITERATION = 4294967296;
    Diagraph.MAX_DELTA_RECOUNT = 8;
    Diagraph.ZOOM_RANGE = [2, 500];
    Diagraph.AXIS_COLOR = '#666';
    Diagraph.GRID_COLOR = '#eee';
    Diagraph.SMOOTH = true;
    Diagraph.CW_ON = true;

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
        context.moveTo(0.5, origin[1]);
        context.lineTo(size[0] + 0.5, origin[1]);
        context.moveTo(origin[0] + 0.5, 0);
        context.lineTo(origin[0] + 0.5, size[1]);
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
        var y = origin[1] % zoom - zoom;
        while (x < size[0]) {
            x += zoom;
            context.moveTo(x + 0.5, 0);
            context.lineTo(x + 0.5, size[1]);
        }
        while (y < size[1]) {
            y += zoom;
            context.moveTo(0.5, y);
            context.lineTo(size[0] + 0.5, y);
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
        if (expression.literal && expression.color) {
            var $canvas = this.createLayer('expression');
            this.$wrap.append($canvas);
            expression.canvas = $canvas[0].getContext('2d');

            this.expressions.push(expression);
        }
        return this;
    };

    _prototype_.equationToCoords = function (data) {

        var range = data.range,
            literal = data.literal,
            offset = data.offset,
            zoom = data.zoom,
            redrawId = data.redrawId;

        var CHORD_FIELD = data.CHORD_FIELD,
            MAX_VALUE = data.MAX_VALUE,
            MAX_ITERATION = data.MAX_ITERATION,
            MAX_DELTA_RECOUNT = data.MAX_DELTA_RECOUNT,
            MIN_DELTA = data.MIN_DELTA,
            MAX_DELTA = (CHORD_FIELD[0] + CHORD_FIELD[1]) / 2 / zoom,
            SMOOTH = data.SMOOTH,
            VAR_X = data.VAR_X;

        var px, py,
            coords = [];

        var maxDeltaRecount = 0,
            fillCount = 0,
            iterationCount = 0;

        var func = new Function(VAR_X, 'return ' + literal + ';');

        var x = range[0],
            y = func(x),
            dx = MAX_DELTA;

        do {
            if (isNaN(y) || Math.abs(y) >= MAX_VALUE) {
                dx = MAX_DELTA;
            } else {
                var deltaRecount = 0;
                do {
                    var dy = y - func(x + dx);
                    var chord = Math.pow(Math.pow(dx, 2) + Math.pow(dy, 2), 0.5);

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
            }

            if (isNaN(dx)) {
                dx = MIN_DELTA;
            }

            x += dx;
            y = func(x);

            if (y > range[3] && y < range[1]) {
                px = offset[0] + x * zoom;
                py = offset[1] - y * zoom;
                coords.push(SMOOTH ? [px, py] : [Math.round(px), Math.round(py)]);
                fillCount++;
            }

            iterationCount++;

        } while (x < range[2] && iterationCount < MAX_ITERATION);

        return {
            redrawId: redrawId,
            coords: coords
        };
    };

    _prototype_.parametricToCoords = function (data) {

        var range = data.range,
            literal = data.literal,
            offset = data.offset,
            zoom = data.zoom,
            redrawId = data.redrawId;

        var CHORD_FIELD = data.CHORD_FIELD,
            MAX_VALUE = data.MAX_VALUE,
            MAX_ITERATION = data.MAX_ITERATION,
            MAX_DELTA_RECOUNT = data.MAX_DELTA_RECOUNT,
            MIN_DELTA = data.MIN_DELTA,
            MAX_DELTA = (CHORD_FIELD[0] + CHORD_FIELD[1]) / 2 / zoom,
            SMOOTH = data.SMOOTH,
            VAR_Q = data.VAR_Q;

        var px, py,
            coords = [],
            domain = literal.domain;

        var maxDeltaRecount = 0,
            fillCount = 0,
            iterationCount = 0;

        var funcX = new Function(VAR_Q, 'return ' + literal.x + ';'),
            funcY = new Function(VAR_Q, 'return ' + literal.y + ';');

        var q = domain[0],
            x = funcX(q),
            y = funcY(q),
            dq = MAX_DELTA;

        do {
            if (isNaN(x) || Math.abs(x) >= MAX_VALUE || isNaN(y) || Math.abs(y) >= MAX_VALUE) {
                dq = MAX_DELTA;
            } else {
                var deltaRecount = 0;
                do {
                    var dx = x - funcX(q + dq);
                    var dy = y - funcY(q + dq);
                    var chord = Math.pow(Math.pow(dx, 2) + Math.pow(dy, 2), 0.5);

                    if (chord * zoom > CHORD_FIELD[0] && chord * zoom < CHORD_FIELD[1]) {
                        break;
                    } else {
                        dq = dq / chord / zoom;
                    }

                    if (dq < MIN_DELTA) {
                        dq = MIN_DELTA;
                        break;
                    }

                    deltaRecount++;
                } while (deltaRecount < MAX_DELTA_RECOUNT);

                if (deltaRecount > maxDeltaRecount) {
                    maxDeltaRecount = deltaRecount;
                }
            }

            if (isNaN(dq)) {
                dq = MIN_DELTA;
            }

            q += dq;
            x = funcX(q);
            y = funcY(q);

            if (y > range[3] && y < range[1]) {
                px = offset[0] + x * zoom;
                py = offset[1] - y * zoom;
                coords.push(SMOOTH ? [px, py] : [Math.round(px), Math.round(py)]);
                fillCount++;
            }

            iterationCount++;

        } while (q < domain[1] && x < range[2] && iterationCount < MAX_ITERATION);

        return {
            redrawId: redrawId,
            coords: coords
        };
    };

    _prototype_.initDrawingWorker = function (workersSize) {
        this._drawingWorker = cw({
            equationToCoords: this.equationToCoords,
            parametricToCoords: this.parametricToCoords
        }, workersSize).on('error', function (err) {
            console.log(err);
        });

        return this;
    };

    _prototype_.cwArg = function (expression) {
        return {
            range: this._range,
            literal: expression.literal,
            offset: this._origin,
            zoom: this._zoom,
            redrawId: this._redrawId,
            CHORD_FIELD: Diagraph.CHORD_FIELD,
            MAX_VALUE: Diagraph.MAX_VALUE,
            MAX_ITERATION: Diagraph.MAX_ITERATION,
            MAX_DELTA_RECOUNT: Diagraph.MAX_DELTA_RECOUNT,
            MIN_DELTA: Diagraph.MIN_DELTA,
            SMOOTH: Diagraph.SMOOTH,
            VAR_X: Expression.VAR_X,
            VAR_Q: Expression.VAR_Q
        };
    };

    _prototype_.drawWithCoords = function (expression, result) {
        if (result.redrawId === this._redrawId) {
            expression.canvas.fillStyle = expression.color;
            result.coords.forEach(function (coord) {
                expression.canvas.fillRect(coord[0], coord[1], 1, 1);
            });
            if (++this._drawingCounter === this.expressions.length) {
                this.trigger('drawingComplete');
            }
        }
    };

    _prototype_.drawExpression = function (expression) {
        var self = this;
        var funcType = (expression.literal.domain ? 'parametric' : 'equation') + 'ToCoords';
        var arg = this.cwArg(expression);

        if (Diagraph.CW_ON) {
            this._drawingWorker[funcType](arg).then(function (result) {
                self.drawWithCoords(expression, result);
            });
        } else {
            this.drawWithCoords(expression, this[funcType](arg));
        }
    };

    _prototype_.drawExpressions = function () {
        var self = this;
        this._drawingWorker.clearQueue();
        this._drawingCounter = 0;
        this.trigger('drawingStart');
        this.expressions.forEach(function (expression) {
            self.drawExpression(expression);
        });
    };

    _prototype_.erasure = function () {
        var size = this.size();
        this.$wrap.find('canvas').each(function () {
            $(this)[0].getContext('2d').clearRect(0, 0, size[0], size[1]);
        });
        return this;
    };

    _prototype_.redraw = function (size, origin) {
        this._redrawId = Math.random();
        this.size(size);
        this.origin(origin);
        return this
            .range()
            .erasure()
            .drawGrid()
            .drawAxis()
            .drawExpressions();
    };

    _prototype_.on = function (type, cb) {
        this._events[type] = cb;
    };

    _prototype_.trigger = function (type) {
        var cb = this._events[type];
        if (cb) {
            cb(type);
        }
    };

    return Diagraph;
});