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

        var color = expression.color;
        var context = expression.canvas;

        var worker = new Worker('app/drawExpression.js');
        worker.postMessage({
            literal: expression.literal,
            range: this._range,
            zoom: this._zoom,
            offset: this._origin,
            CHORD_FIELD: Diagraph.CHORD_FIELD,
            MAX_ITERATION: Diagraph.MAX_ITERATION,
            MAX_DELTA_RECOUNT: Diagraph.MAX_DELTA_RECOUNT,
            MIN_DELTA: Diagraph.MIN_DELTA
        });

        context.fillStyle = color;

        worker.addEventListener('message', function (msg) {
            var data = msg.data;
            if (data) {
                context.fillRect(data.x, data.y, 1, 1);
            } else {

            }
        });
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