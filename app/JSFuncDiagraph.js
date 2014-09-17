/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

(function () {
    function JSFuncDiagraph($canvas) {
        this.canvas = $canvas;
        this.funExpressions = [];
    }

    var _prototype_ = JSFuncDiagraph.prototype;

    _prototype_.setCanvasSize = function (width, height) {
        this.width = width;
        this.height = height;
        this.canvas
            .css('width', width)
            .css('height', height);
        return this;
    };

    _prototype_.pushExpression = function (expression) {
        this.funExpressions.push(expression);
    };

    _prototype_.drawExpression = function (expression) {
        var func = expression.func;
    };

    window.JSFuncDiagraph = JSFuncDiagraph;
})();