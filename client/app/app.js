/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

define([
    'Diagraph',
    'Expression',
    'underscore',
    'page',
    'jquery.mousewheel'
], function (Diagraph, Expression, _, page) {
    'use strict';

    //var palette = new Palette($('#palette'));

    page();

    var $window = $(window);
    var $body = $('body');
    var width = $body.width();
    var height = $body.width();
    var $canvas = $('#canvas');

    var diagraph = new Diagraph($canvas, [width, height]);
    diagraph
        .pushExpression(new Expression('y = tan(x)', '#f00'))
        .pushExpression(new Expression('y = 1/x', '#0f0'))
        .pushExpression(new Expression('y = 2/x', '#0ff'))
        .pushExpression(new Expression('y = 3/x', '#00f'))
        .pushExpression(new Expression('y = 4/x', '#ff0'))
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
        .pushExpression(new Expression('y = 20/x'));

    diagraph.redraw([width, height]);

    $window.on('resize', _.throttle(function () {
        diagraph.redraw([$body.width(), $body.height()]);
    }, 2000));

    var drag = {
        client: [],
        origin: []
    };
    var enableCrossCursor = true;

    var $cursorX = $('#cursor-x'),
        $cursorY = $('#cursor-y');

    var $lineX = $('#line-x'),
        $lineY = $('#line-y');

    var dragStart = function (event) {
        $body.addClass('drag-start');
        drag.client = [event.clientX, event.clientY];
        drag.origin = diagraph.origin();
        $lineX.css('left', '-99999px');
        $lineY.css('top', '-99999px');
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

    var crossCursor = function (event) {
        event.stopPropagation();
        var origin = diagraph.origin();
        var zoom = diagraph.zoom();
        $cursorX.html((event.clientX - origin[0]) / zoom);
        $cursorY.html((origin[1] - event.clientY) / zoom);
        if (enableCrossCursor) {
            $lineX.css('left', event.clientX);
            $lineY.css('top', event.clientY);
        }
    };

    $('#bl-panel button, #br-panel button').on('mousedown', function (event) {
        event.stopPropagation();
    }).on('mouseup', function (event) {
        event.stopPropagation();
    });

    $window.on('mousemove.crossCursor', crossCursor);
    $window.on('mousedown', function (event) {
        event.stopPropagation();
        dragStart(event);
        $window.on('mousemove.drag', dragging);
        $window.off('mousemove.crossCursor', crossCursor);
    });

    $window.on('mouseup', function (event) {
        event.stopPropagation();
        $window.off('mousemove.drag');
        $window.on('mousemove.crossCursor', crossCursor);
        dragEnd(event);
    });

    var ratio = 1.4142135623730951;
    var onZoom = function (delta) {
        var zoom = Math.round(Math.pow(ratio, delta) * diagraph.zoom());
        diagraph.zoom(zoom);
        if (diagraph.zoom() === zoom) {
            $('#zoom-level').html(Math.round(Math.log(diagraph.zoom()) / Math.log(ratio)) - 1);
            diagraph.redraw();
        }
    };

    $window.on('mousewheel', function (event) {
        event.stopPropagation();
        onZoom(event.deltaY * event.deltaFactor / 100);
    });

    $('#centered-btn').on('click', function (event) {
        event.stopPropagation();
        diagraph.redraw(false, 0);
    });

    $('#zoom-in-btn').on('click', function (event) {
        event.stopPropagation();
        onZoom(1);
    });

    $('#zoom-out-btn').on('click', function (event) {
        event.stopPropagation();
        onZoom(-1);
    });

    $('#smooth-btn').on('click', function (event) {
        event.stopPropagation();
        Diagraph.SMOOTH = !Diagraph.SMOOTH;
        diagraph.redraw();
    });

    $('#cross-cursor-btn').on('click', function (event) {
        event.stopPropagation();
        enableCrossCursor = !enableCrossCursor;
        if (!enableCrossCursor) {
            $lineX.css('left', '-99999px');
            $lineY.css('top', '-99999px');
        }
    });
});