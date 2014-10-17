/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

$(function () {

//    var palette = new Palette($('#palette'));

    var $window = $(window);
    var $body = $('body');
    var $canvas = $('#canvas');

    var diagraph = new Diagraph($canvas, [$body.width(), $body.height()]);
    diagraph
        .pushExpression(new Expression('y = tan(x)'))
        .pushExpression(new Expression('y = cos(x)/sin(x)'))
        .pushExpression(new Expression('y = sin(x)', '#600'))
        .pushExpression(new Expression('y = arct(x)', '#660'))
        .pushExpression(new Expression('y = - arcs(x)', '#606'))
        .pushExpression(new Expression('y = 1/x', '#060'))
        .pushExpression(new Expression('y = -1/x', '#006'))
        .pushExpression(new Expression('y = pow(x, 2)', '#006'))
//        .pushExpression(new Expression('x = 4*cos(2*q)*cos(q);y = 4*cos(2*q)*sin(q);q = (0, 2*PI);', '#066'));
        .pushExpression(new Expression('y = 3/x'))
        .pushExpression(new Expression('y = 4/x'))
        .pushExpression(new Expression('y = 5/x'))
        .pushExpression(new Expression('y = 6/x'))
        .pushExpression(new Expression('y = 7/x'))
        .pushExpression(new Expression('y = 8/x'))
        .pushExpression(new Expression('y = 9/x'))
        .pushExpression(new Expression('y = 10/x'))
        .pushExpression(new Expression('y = 11/x'))
        .pushExpression(new Expression('y = 12/x'))
        .pushExpression(new Expression('y = 13/x'))
        .pushExpression(new Expression('y = 14/x'))
        .pushExpression(new Expression('y = 15/x'))
        .pushExpression(new Expression('y = 16/x'))
        .pushExpression(new Expression('y = 17/x'))
        .pushExpression(new Expression('y = 18/x'))
        .pushExpression(new Expression('y = 19/x'))
        .pushExpression(new Expression('y = 20/x'))
        .pushExpression(new Expression('y = -1/x'))
        .pushExpression(new Expression('y = -2/x'))
        .pushExpression(new Expression('y = -3/x'))
        .pushExpression(new Expression('y = -4/x'))
        .pushExpression(new Expression('y = -5/x'))
        .pushExpression(new Expression('y = -6/x'))
        .pushExpression(new Expression('y = -7/x'))
        .pushExpression(new Expression('y = -8/x'))
        .pushExpression(new Expression('y = -9/x'))
        .pushExpression(new Expression('y = -10/x'))
        .pushExpression(new Expression('y = -11/x'))
        .pushExpression(new Expression('y = -12/x'))
        .pushExpression(new Expression('y = -13/x'))
        .pushExpression(new Expression('y = -14/x'))
        .pushExpression(new Expression('y = -15/x'))
        .pushExpression(new Expression('y = -16/x'))
        .pushExpression(new Expression('y = -17/x'))
        .pushExpression(new Expression('y = -18/x'))
        .pushExpression(new Expression('y = -19/x'))
        .pushExpression(new Expression('y = -20/x'))
        .pushExpression(new Expression('y = 100/pow(x,2) - 1/pow(x,4)'))
        .pushExpression(new Expression('y = log(x)*1000'))
        .pushExpression(new Expression('y = 10/pow(x,2) - 1/pow(x,4)'))
        .pushExpression(new Expression('y = tan(x)'))
        .pushExpression(new Expression('y = -tan(x)'))
        .pushExpression(new Expression('y = 1/(1-pow(E, x/(1-x)))'));

    diagraph.redraw([$body.width(), $body.height()]);

    $window.on('resize', _.throttle(function () {
        diagraph.redraw([$body.width(), $body.height()]);
    }, 500));

    var drag = {
        client: [],
        origin: []
    };

    var dragStart = function (event) {
        $body.addClass('drag-start');
        drag.client = [event.clientX, event.clientY];
        drag.origin = diagraph.origin();
    };

    var dragging = function (event) {
        $body.removeClass('drag-start').addClass('dragging');
        $canvas.css('transform', 'translate(' + (event.clientX - drag.client[0]) + 'px,' + (event.clientY - drag.client[1]) + 'px)');
    };

    var dragEnd = function (event) {
        $body.removeClass('drag-start').removeClass('dragging');
        var offset = [
                drag.origin[0] + event.clientX - drag.client[0],
                drag.origin[1] + event.clientY - drag.client[1]
        ];
        $canvas.css('transform', 'translate(0,0)');
        diagraph.redraw(false, offset);
    };

    var coordinate = function (event) {
        var origin = diagraph.origin();
        var zoom = diagraph.zoom();
        $cursorX.html((event.clientX - origin[0]) / zoom);
        $cursorY.html((origin[1] - event.clientY) / zoom);
    };

    var $cursorX = $('#cursor-x');
    var $cursorY = $('#cursor-y');

    $window.on('mousemove.coordinate', coordinate);
    $window.on('mousedown', function (event) {
        dragStart(event);
        $window.on('mousemove.drag', dragging);
        $window.off('mousemove.coordinate', coordinate);
    });

    $window.on('mouseup', function (event) {
        $window.off('mousemove.drag');
        $window.on('mousemove.coordinate', coordinate);
        dragEnd(event);
    });

    var zoomInOut = _.throttle(function (isIn) {
        var ratio = 1.4142135623730951;
        diagraph.zoom(isIn > 0 ? diagraph.zoom() * ratio : diagraph.zoom() / ratio);
        diagraph.redraw();
    }, 500);

    $window.on('mousewheel', function (event) {
        zoomInOut(event.deltaY);
    });

    $('#centered-btn').click(function () {
        diagraph.redraw(false, 0);
    });

    $('#zoom-in-btn').click(function () {
        zoomInOut(1);
    });

    $('#zoom-out-btn').click(function () {
        zoomInOut(-1);
    });
});