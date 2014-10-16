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
//        .pushExpression(new Expression('y = Math.tan(x)'));
        .pushExpression(new Expression('y = sin(x)', '#600'))
        .pushExpression(new Expression('y = arct(x)', '#660'))
        .pushExpression(new Expression('y = - arcs(x)', '#606'))
        .pushExpression(new Expression('y = 1/x', '#060'))
        .pushExpression(new Expression('y = 2/x', '#006'))
        .pushExpression(new Expression('y = pow(x, 2)', '#006'))
//        .pushExpression(new Expression('x = 4*cos(2*q)*cos(q);y = 4*cos(2*q)*sin(q);q = (0, 2*PI);', '#066'));
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
//        .pushExpression(new Expression('y = Math.tan(x)'))
//        .pushExpression(new Expression('y = -Math.tan(x)'))
//        .pushExpression(new Expression('y = 1/(1-Math.pow(Math.E, x/(1-x)))'));

    diagraph.redraw([$body.width(), $body.height()]);

    $window.on('resize', _.throttle(function () {
        diagraph.redraw([$body.width(), $body.height()]);
    }, 500));

    var redraw = _.throttle(function () {
        diagraph.redraw();
    }, 500);

    $window.on('mousewheel', function (event) {
        var ratio = 1.4142135623730951;

        diagraph.zoom(event.deltaY > 0 ? diagraph.zoom() * ratio : diagraph.zoom() / ratio);
        redraw();
    });

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
        $canvas
            .css('margin-left', event.clientX - drag.client[0])
            .css('margin-top', event.clientY - drag.client[1]);
    };

    var dragEnd = function (event) {
        $body.removeClass('drag-start').removeClass('dragging');
        var offset = [
                drag.origin[0] + event.clientX - drag.client[0],
                drag.origin[1] + event.clientY - drag.client[1]
        ];
        $canvas.css('margin-left', 0).css('margin-top', 0);
        diagraph.redraw(false, offset);
    };

    $window.on('mousedown', function (event) {
        dragStart(event);
        $window.on('mousemove.drag', dragging);
    });

    $window.on('mouseup', function (event) {
        $window.off('mousemove.drag');
        dragEnd(event);
    });
});