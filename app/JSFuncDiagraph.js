/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

(function () {
    function JSFuncDiagraph($canvas, size) {
        this.$canvas = $canvas;
        this.context = this.$canvas[0].getContext('2d');
        this.funExpressions = [];

        this.zoom = 5;
        this.size(size);
        this.origin(0);
        this.range();
    }

    var _prototype_ = JSFuncDiagraph.prototype;

    _prototype_.range = function (origin, zoom) {
        var size = this.size();
        var offset = origin || this._origin;
        var zoom = zoom || this.zoom;
        this._range = [
                -offset[0] / zoom,
                offset[1] / zoom,
                (size[0] - offset[0]) / zoom,
                (offset[1] - size[1]) / zoom
        ];
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

    _prototype_.pushExpression = function (expression) {
        this.funExpressions.push(expression);
    };

    _prototype_.drawExpression = function (expression) {

        var func = expression.func;
        var context = this.context;
        var range = this._range;
        var offset = this._origin;
        var zoom = this.zoom;

        context.fillStyle = '#f00';
        var x = range[0];
        var y;

        var dx = 1 / zoom;
        var slope;

        // compute first value
        y = func(x);
        var px = offset[0] + x * zoom;
        var py = offset[1] - y * zoom;

        var countOuter = 0;
        do {
            var count = 0;
            do {
                var dy = y - func(x + dx);
                var c = Math.pow(Math.pow(dx, 2) + Math.pow(dy, 2), .5);

                if (c * zoom > .8 && c * zoom < 1.2) {
                    break;
                } else {
                    dx = Math.cos(Math.atan(dy / dx)) / zoom || Number.EPSILON;
                }
                count++;
            } while (count < 1000);
            console.log('count: ', count);

            x += dx;
            y = func(x);

            if (y > range[3] && y < range[1]) {

                px = offset[0] + x * zoom;
                py = offset[1] - y * zoom;

                context.fillRect(px - 1, py, 1, 1);
            } else {
                x += (1 / zoom);
            }

            countOuter++;
        } while (x < range[2] && countOuter < 100000);

        console.log('countOuter: ', countOuter);
    };

    window.JSFuncDiagraph = JSFuncDiagraph;
})();