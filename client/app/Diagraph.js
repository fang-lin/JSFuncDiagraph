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
        this.ZOOM_RANGE = [2, 500];
        this.AXIS_COLOR = '#000';
        this.GRID_COLOR = '#ddd';
        this.SMOOTH = true;
        this.CW_ON = true;

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
        this._drawCount = 0;
    }

    Diagraph.MIN_DELTA = 1e-7;
    Diagraph.MAX_VALUE = 1e100;
    Diagraph.CHORD_FIELD = [0.9, 1.1];
    Diagraph.MAX_ITERATION = 4294967296;
    Diagraph.MAX_DELTA_RECOUNT = 32;
    Diagraph.STATE_ON = '+';
    Diagraph.STATE_OFF = '-';

    var _prototype_ = Diagraph.prototype;

    _prototype_.createLayer = function (className) {
        return $('<canvas class="' + className + '"/>').attr('width', this.$wrap.width()).attr('height', this.$wrap.height());
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
        context.moveTo(0, Math.floor(origin[1]) + 0.5);
        context.lineTo(size[0], Math.floor(origin[1]) + 0.5);
        context.moveTo(Math.floor(origin[0]) + 0.5, 0);
        context.lineTo(Math.floor(origin[0]) + 0.5, size[1]);

        context.strokeStyle = this.AXIS_COLOR;
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
            context.moveTo(0, y + 0.5);
            context.lineTo(size[0], y + 0.5);
        }
        context.strokeStyle = this.GRID_COLOR;
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
            var ZOOM_RANGE = this.ZOOM_RANGE;
            if (zoom >= ZOOM_RANGE[0] && zoom <= ZOOM_RANGE[1]) {
                this._zoom = zoom;
            }
            return this;
        } else {
            return this._zoom;
        }
    };

    _prototype_.drawCount = function (delta) {
        this._drawCount += delta;
        if (this._drawCount > 0) {
            this.trigger('computing');
        } else {
            this._drawCount = 0;
            this.trigger('completed');
        }
    };

    _prototype_.getExpressionsArray = function () {
        return this.expressions.map(function (exp) {
            var literal;
            if (exp.expression.domain) {
                literal = exp.expression.x + ';' + exp.expression.y + ';' + exp.expression.domain;
            } else {
                literal = exp.expression;
            }
            return [literal, exp.rgb, exp.hide ? Diagraph.STATE_ON : Diagraph.STATE_OFF];
        });
    };

    _prototype_.emptyExpressions = function () {
        this.expressions.map(function (expr) {
            expr.$canvas.remove();
        });
        this.expressions = [];
        return this;
    };


    _prototype_.deleteExpression = function (index) {
        var deleted = this.expressions.splice(index, 1)[0];
        if (deleted) {
            deleted.$canvas.remove();
            return deleted;
        }
        return null;
    };

    _prototype_.batchExpressions = function (expressions) {
        var self = this;
        this.emptyExpressions();
        expressions.forEach(function (expr) {
            self.pushExpression(new Expression(expr[0], expr[1], expr[2]));
        });
        return this;
    };

    _prototype_.pushExpression = function (expression) {
        if (expression.literal && expression.color) {
            var $canvas = this.createLayer('expression');
            this.$wrap.append($canvas);
            expression.$canvas = $canvas;
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

        var func = new Function(VAR_X, 'return ' + literal + ';');

        var x = range[0],
            y = func(x),
            dx = MAX_DELTA;

        var iterationCount = 0,
            overflow = false,
            tx = NaN;

        function computeDx() {
            var deltaRecount = 0,
                lower = 0,
                upper = null,
                k = dx > 0 ? 1 : -1;
            do {
                var dy = y - func(x + dx);
                var chord = Math.pow(Math.pow(dx, 2) + Math.pow(dy, 2), 0.5);

                if (chord * zoom < CHORD_FIELD[0]) {
                    lower = dx;
                    if (upper == null) {
                        dx *= 2;
                    } else {
                        dx += (upper - lower) / 2;
                    }
                } else if (chord * zoom > CHORD_FIELD[1]) {
                    upper = dx;
                    dx -= (upper - lower) / 2;
                } else {
                    break;
                }

                if (Math.abs(dx) < MIN_DELTA) {
                    dx = k * MIN_DELTA;
                    break;
                }

            } while (deltaRecount++ < MAX_DELTA_RECOUNT);

            if (isNaN(dx)) {
                dx = k * MIN_DELTA;
            }
        }

        do {
            if (isNaN(y) || Math.abs(y) >= MAX_VALUE || y < range[3] || y > range[1]) {

                if (!overflow && dx < 0) {
                    // draw to negative direction
                    x = tx;
                    y = func(x);
                    dx = MAX_DELTA;
                    computeDx();
                    overflow = false;
                } else {
                    dx = MAX_DELTA;
                    overflow = true;
                }

                x += dx;
                y = func(x);

            } else {

                if (overflow) {
                    // enter range first, reverse dx
                    dx = -MAX_DELTA;
                    // temporary recording x to tx
                    tx = x;
                }
                overflow = false;

                px = offset[0] + x * zoom;
                py = offset[1] - y * zoom;
                coords.push(SMOOTH ? [px, py] : [Math.round(px), Math.round(py)]);

                computeDx();

                x += dx;
                y = func(x);
            }

        } while (x < range[2] && iterationCount++ < MAX_ITERATION);

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

        var funcX = new Function(VAR_Q, 'return ' + literal.x + ';'),
            funcY = new Function(VAR_Q, 'return ' + literal.y + ';');

        var q = domain[0],
            x = funcX(q),
            y = funcY(q),
            dq = MAX_DELTA;

        var iterationCount = 0;

        do {

            if (isNaN(x) || Math.abs(x) >= MAX_VALUE || isNaN(y) || Math.abs(y) >= MAX_VALUE) {
                dq = MAX_DELTA;
            } else {
                var deltaRecount = 0,
                    lower = 0,
                    upper = null;

                do {
                    var dx = x - funcX(q + dq),
                        dy = y - funcY(q + dq);

                    var chord = Math.pow(Math.pow(dx, 2) + Math.pow(dy, 2), 0.5);

                    if (chord * zoom < CHORD_FIELD[0]) {
                        lower = dq;
                        if (upper == null) {
                            dq *= 2;
                        } else {
                            dq += (upper - lower) / 2;
                        }
                    } else if (chord * zoom > CHORD_FIELD[1]) {
                        upper = dq;
                        dq -= (upper - lower) / 2;
                    } else {
                        break;
                    }

                    if (dq < MIN_DELTA) {
                        dq = MIN_DELTA;
                        break;
                    }

                } while (deltaRecount++ < MAX_DELTA_RECOUNT);
            }

            if (isNaN(dq)) {
                dq = MIN_DELTA;
            }

            q += dq;
            x = funcX(q);
            y = funcY(q);

            if (x > range[0] && x < range[2] && y > range[3] && y < range[1]) {
                px = offset[0] + x * zoom;
                py = offset[1] - y * zoom;
                coords.push(SMOOTH ? [px, py] : [Math.round(px), Math.round(py)]);
            }

        } while (q < domain[1] && iterationCount++ < MAX_ITERATION);

        return {
            redrawId: redrawId,
            coords: coords
        };
    };

    _prototype_.initDrawingWorker = function (workersSize) {
        var self = this;

        this._drawingWorker = cw({
            equationToCoords: this.equationToCoords,
            parametricToCoords: this.parametricToCoords
        }, workersSize).on('error', function (err) {
            console.error(err);
            self.drawCount(-1);
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
            SMOOTH: this.SMOOTH,
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
        }
    };

    _prototype_.drawExpression = function (expression) {
        if (!expression.hide) {
            var self = this;

            var funcType = (expression.literal.domain ? 'parametric' : 'equation') + 'ToCoords';
            var arg = this.cwArg(expression);

            if (this.CW_ON) {
                this.drawCount(1);
                this._drawingWorker[funcType](arg).then(function (coords) {
                    self.drawWithCoords(expression, coords);
                    self.trigger('drawingComplete');
                    self.drawCount(-1);
                });
            } else {
                this.drawWithCoords(expression, this[funcType](arg));
            }
        }
        return this;
    };

    _prototype_.drawExpressions = function () {
        var self = this;
        this._drawingWorker.clearQueue();
        this.expressions.forEach(function (expression) {
            return self.drawExpression(expression);
        });
    };

    _prototype_.erasure = function (expression) {
        var size = this.size();
        expression.canvas.clearRect(0, 0, size[0], size[1]);
        return this;
    };

    _prototype_.erasureAll = function () {
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
            .erasureAll()
            .drawGrid()
            .drawAxis()
            .drawExpressions();
    };

    _prototype_.on = function (type, cb) {
        this._events[type] = cb;
        return this;
    };

    _prototype_.trigger = function (type) {
        var cb = this._events[type];
        if (cb) {
            cb(type);
        }
        return this;
    };

    return Diagraph;
});