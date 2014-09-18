/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

$(function () {

//    var palette = new Palette($('#palette'));

    var $window = $(window);
    var $body = $('html');

    var diagraph = new JSFuncDiagraph($('#canvas'), [$body.width(), $body.height()]);
    diagraph
//        .pushExpression(new Expression('y = Math.tan(x)'));
        .pushExpression(new Expression('y = Math.sin(x)'))
        .pushExpression(new Expression('y = Math.cos(x)'))
        .pushExpression(new Expression('y = -Math.sin(x)'))
//        .pushExpression(new Expression('y = 1/x'))
//        .pushExpression(new Expression('y = 2/x'))
//        .pushExpression(new Expression('y = 3/x'))
//        .pushExpression(new Expression('y = 4/x'))
//        .pushExpression(new Expression('y = 5/x'))
//        .pushExpression(new Expression('y = 6/x'))
//        .pushExpression(new Expression('y = 7/x'))
//        .pushExpression(new Expression('y = 8/x'))
//        .pushExpression(new Expression('y = 9/x'))
//        .pushExpression(new Expression('y = 10/x'))
//        .pushExpression(new Expression('y = 11/x'))
//        .pushExpression(new Expression('y = 12/x'))
//        .pushExpression(new Expression('y = 13/x'))
//        .pushExpression(new Expression('y = 14/x'))
//        .pushExpression(new Expression('y = 15/x'))
//        .pushExpression(new Expression('y = 16/x'))
//        .pushExpression(new Expression('y = 17/x'))
//        .pushExpression(new Expression('y = 18/x'))
//        .pushExpression(new Expression('y = 19/x'))
//        .pushExpression(new Expression('y = 20/x'))
//        .pushExpression(new Expression('y = -1/x'))
//        .pushExpression(new Expression('y = -2/x'))
//        .pushExpression(new Expression('y = -3/x'))
//        .pushExpression(new Expression('y = -4/x'))
//        .pushExpression(new Expression('y = -5/x'))
//        .pushExpression(new Expression('y = -6/x'))
//        .pushExpression(new Expression('y = -7/x'))
//        .pushExpression(new Expression('y = -8/x'))
//        .pushExpression(new Expression('y = -9/x'))
//        .pushExpression(new Expression('y = -10/x'))
//        .pushExpression(new Expression('y = -11/x'))
//        .pushExpression(new Expression('y = -12/x'))
//        .pushExpression(new Expression('y = -13/x'))
//        .pushExpression(new Expression('y = -14/x'))
//        .pushExpression(new Expression('y = -15/x'))
//        .pushExpression(new Expression('y = -16/x'))
//        .pushExpression(new Expression('y = -17/x'))
//        .pushExpression(new Expression('y = -18/x'))
//        .pushExpression(new Expression('y = -19/x'))
//        .pushExpression(new Expression('y = -20/x'))
//        .pushExpression(new Expression('y = 100/Math.pow(x,2) - 1/Math.pow(x,4)'));
//        .pushExpression(new Expression('y = Math.log(x)*1000'));
//        .pushExpression(new Expression('y = 10/Math.pow(x,2) - 1/Math.pow(x,4)'));
        .pushExpression(new Expression('y = Math.tan(x)'))
        .pushExpression(new Expression('y = -Math.tan(x)'))
//        .pushExpression(new Expression('y = 1/(1-Math.pow(Math.E, x/(1-x)))'));

    diagraph.redraw([$body.width(), $body.height()]);

    $(window).on('resize', _.throttle(function () {
        diagraph.redraw([$body.width(), $body.height()]);
    }, 200));

    var redraw = _.throttle(function () {
        diagraph.redraw();
    }, 200);

    $(window).on('mousewheel', function (event) {
        var ratio = 1.5;
        if (event.deltaY > 0) {
            // zoom in
            diagraph.zoom(diagraph.zoom() * ratio);
        } else {
            // zoom out
            diagraph.zoom(diagraph.zoom() / ratio);
        }
        redraw();
    });

    var drag = {
        client: [],
        origin: []
    };

    var dragStart = function (event) {
        drag.client = [event.clientX, event.clientY];
        drag.origin = diagraph.origin();
    };
    var dragging = _.throttle(function (event) {
        //todo: redraw coordinate.
    }, 200);

    var dragEnd = function (event) {
        var offset = [
                drag.origin[0] + event.clientX - drag.client[0],
                drag.origin[1] + event.clientY - drag.client[1]
        ];
        diagraph.redraw(false, offset);
    };

    $(window).on('mousedown', function (event) {
        dragStart(event);
        $(window).on('mousemove.drag', dragging);
    });

    $(window).on('mouseup', function (event) {
        $(window).off('mousemove.drag');
        dragEnd(event);
    });


});

var y;
console.dir(Number.isFinite(y));