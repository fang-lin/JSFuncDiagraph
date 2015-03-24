/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

define([
    'Diagraph',
    'Palette',
    'Expression',
    'expressionsParser',
    'backbone',
    'jquery.mousewheel',
    'lz-string'
], function (Diagraph, Palette, Expression, expressionsParser) {
    'use strict';

    LZString._keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-=';

    var RATIO = 1.4142135623730951;
    var WHEEL_DAMP = 300;
    var ZOOM_LEVEL = 7;
    var ENABLE_CROSS_CURSOR = true;
    var DELTA_SUM = 0;
    var EXPRESSIONS = LZString.compressToBase64('y=x#f00|y=pow(x,2)#ff0|y=1/x');
    console.log(EXPRESSIONS);
    var SIZE;

    var $window = $(window);
    var $body = $('body');
    var $canvas = $('#canvas');
    refreshSize();

    var diagraph = new Diagraph($canvas, SIZE);
    //var palette = new Palette($('#palette'));

    var Router = Backbone.Router.extend({
        routes: {
            ':x/:y/:zoom/:isSmooth/:hasCrossCursor/:expressions': 'main',
            '*otherwise': 'otherwise'
        },
        main: function (x, y, zoom, enableSmooth, enableCrossCursor, exprBase64) {
            var origin = [Math.round(x), Math.round(y)];
            var zoomLevel = Math.round(zoom);
            var _zoom = parseZoom(zoomLevel);

            ZOOM_LEVEL = zoomLevel;
            Diagraph.SMOOTH = enableSmooth === 'true';
            ENABLE_CROSS_CURSOR = enableCrossCursor === 'true';
            EXPRESSIONS = LZString.decompressFromBase64(exprBase64);
            console.log(EXPRESSIONS);

            diagraph.zoom(_zoom);
            diagraph.origin(parseOrigin(origin));

            refreshState({});

            EXPRESSIONS.split('|').forEach(function (item) {
                var exprs = item.split('#');
                diagraph.pushExpression(new Expression(exprs[0], exprs[1]));
            });

            diagraph.redraw(SIZE);

        },
        otherwise: function () {
            refreshState({}, true);
        }
    });

    var router = new Router();

    Backbone.history.start({pushState: true});

    var drag = {
        client: [],
        origin: []
    };

    var $zoomLevel = $('#zoom-level').html(ZOOM_LEVEL),
        $smoothBtn = $('#smooth-btn'),
        $crossCursorBtn = $('#cross-cursor-btn'),
        $cursorX = $('#cursor-x'),
        $cursorY = $('#cursor-y');

    var $lineX = $('#line-x'),
        $lineY = $('#line-y');

    refreshSmoothBtn();
    refreshCrossCursorBtn();

    $('#bl-panel button, #br-panel button').on('mousedown', function (event) {
        event.stopPropagation();
    }).on('mouseup', function (event) {
        event.stopPropagation();
    });

    $window.on('resize', _.throttle(function () {
        refreshSize();
        diagraph.redraw(SIZE);
    }, 800));

    $window.on('mousemove.crossCursor', onMouseMoveCrossCursor);
    $window.on('mousedown', function (event) {
        event.stopPropagation();
        onDragStart(event);
        $window.on('mousemove.drag', onDragging);
        $window.off('mousemove.crossCursor', onMouseMoveCrossCursor);
    });

    $window.on('mouseup', function (event) {
        event.stopPropagation();
        $window.off('mousemove.drag');
        $window.on('mousemove.crossCursor', onMouseMoveCrossCursor);
        onDragEnd(event);
    });

    $window.on('mousewheel', function (event) {
        event.stopPropagation();
        onZoom(event.deltaY * event.deltaFactor / WHEEL_DAMP);
        onMouseMoveCrossCursor(event);
    });

    $('#centered-btn').on('click', function (event) {
        event.stopPropagation();
        diagraph.redraw(false, 0);
        refreshState({
            origin: toOrigin(diagraph.origin())
        });
    });

    $('#zoom-in-btn').on('click', function (event) {
        event.stopPropagation();
        onZoom(1);
    });

    $('#zoom-out-btn').on('click', function (event) {
        event.stopPropagation();
        onZoom(-1);
    });

    $smoothBtn.on('click', function (event) {
        event.stopPropagation();
        Diagraph.SMOOTH = !Diagraph.SMOOTH;
        refreshSmoothBtn();
        $smoothBtn.html();
        diagraph.redraw();
        refreshState({
            enableSmooth: Diagraph.SMOOTH
        });
    });

    $crossCursorBtn.on('click', function (event) {
        event.stopPropagation();
        ENABLE_CROSS_CURSOR = !ENABLE_CROSS_CURSOR;
        refreshCrossCursorBtn();
        if (!ENABLE_CROSS_CURSOR) {
            $lineX.css('left', '-99999px');
            $lineY.css('top', '-99999px');
        }
        refreshState({
            enableCrossCursor: ENABLE_CROSS_CURSOR
        });
    });

    function refreshSmoothBtn() {
        $smoothBtn.children('span').html(Diagraph.SMOOTH ? 'On' : 'Off');
    }

    function refreshCrossCursorBtn() {
        $crossCursorBtn.children('span').html(ENABLE_CROSS_CURSOR ? 'On' : 'Off');
    }

    function onDragStart(event) {
        $body.addClass('drag-start');
        drag.client = [event.clientX, event.clientY];
        drag.origin = diagraph.origin();
        $lineX.css('left', '-99999px');
        $lineY.css('top', '-99999px');
    }

    function onDragging(event) {
        $body.removeClass('drag-start').addClass('dragging');
        $canvas.css('transform', 'translate(' + (event.clientX - drag.client[0]) + 'px,' + (event.clientY - drag.client[1]) + 'px)');
    }

    function onDragEnd(event) {
        $body.removeClass('drag-start').removeClass('dragging');
        var offset = [
            drag.origin[0] + event.clientX - drag.client[0],
            drag.origin[1] + event.clientY - drag.client[1]
        ];
        $canvas.css('transform', 'translate(0,0)');
        diagraph.redraw(false, offset);
        refreshState({
            origin: toOrigin(diagraph.origin())
        });
    }

    function onMouseMoveCrossCursor(event) {
        event.stopPropagation();
        var origin = diagraph.origin();
        var zoom = diagraph.zoom();
        $cursorX.html((event.clientX - origin[0]) / zoom);
        $cursorY.html((origin[1] - event.clientY) / zoom);
        if (ENABLE_CROSS_CURSOR) {
            $lineX.css('left', event.clientX);
            $lineY.css('top', event.clientY);
        }
    }

    function refreshState(state, trigger) {
        if (ZOOM_LEVEL < 1) {
            ZOOM_LEVEL = 1;
        }
        if (ZOOM_LEVEL > 16) {
            ZOOM_LEVEL = 16;
        }
        var _state = $.extend({
            origin: toOrigin(diagraph.origin()),
            zoom: Math.round(ZOOM_LEVEL),
            enableSmooth: Diagraph.SMOOTH,
            enableCrossCursor: ENABLE_CROSS_CURSOR,
            expr: LZString.compressToBase64(EXPRESSIONS)
        }, state);

        router.navigate(
            _state.origin[0] + '/' +
            _state.origin[1] + '/' +
            _state.zoom + '/' +
            _state.enableSmooth + '/' +
            _state.enableCrossCursor + '/' +
            _state.expr,
            {trigger: !!trigger}
        );
    }

    function onZoom(delta) {
        DELTA_SUM += delta;
        if (Math.abs(DELTA_SUM) >= 1) {

            var _delta = delta > 0 ? 1 : -1;
            ZOOM_LEVEL += _delta;

            var zoom = parseZoom(ZOOM_LEVEL);
            diagraph.zoom(zoom);

            if (diagraph.zoom() === zoom) {
                diagraph.redraw();
                $zoomLevel.html(ZOOM_LEVEL);
                refreshState({zoom: ZOOM_LEVEL});
            } else {
                ZOOM_LEVEL -= _delta;
            }
            DELTA_SUM = 0;
        }
    }

    function parseZoom(level) {
        return Math.pow(RATIO, level + 1);
    }

    function parseOrigin(origin) {
        var size = diagraph.size();

        return [
            size[0] / 2 + origin[0],
            size[1] / 2 + origin[1]
        ];
    }

    function toOrigin(origin) {
        var size = diagraph.size();

        return [
            origin[0] - size[0] / 2,
            origin[1] - size[1] / 2
        ];
    }

    function refreshSize() {
        SIZE = [$body.width(), $body.height()];
    }
});