/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

define([
    'Diagraph',
    'Palette',
    'Expression',
    'parser',
    'backbone',
    'jquery.mousewheel'
], function (Diagraph, Palette, Expression, parser) {
    'use strict';

    var RATIO = 1.4142135623730951;
    var WHEEL_DAMP = 400;
    var ZOOM_LEVEL = 7;
    var ENABLE_CROSS_CURSOR = true;
    var DELTA_SUM = 0;
    var ON = 'on', OFF = 'off';
    var EXPRESSIONS = [
        //['y=x', 'f00'],
        //['y=pow(x,2)', 'ff0'],
        //['y=1/x'],
        ['x=4*(sin(2*q)+0.2*sin(100*q))*cos(q);y=4*(sin(2*q)+0.2*sin(100*q))*sin(q);q=[0,2*PI]', 'f00'],
        ['x=4*cos(8*q)*cos(q);y=4*cos(8*q)*sin(q);q=[0,2*PI];', '0f0'],
        ['x=4*cos(2*q)*cos(q);y=4*cos(2*q)*sin(q);q=[0,2*PI];', '0ff'],
        ['x=q*cos(q);y=q*sin(q);q=[-1.5*PI,1.5*PI];', 'ff0'],
        ['x=6*cos(q);y=3*sin(q);q=[0,2*PI];', 'f0f']
    ];

    var SIZE;

    var $window = $(window);
    var $body = $('body');
    var $canvas = $('#canvas');

    var $zoomLevel = $('#zoom-level'),
        $smoothBtn = $('#smooth-btn'),
        $cursorBtn = $('#cursor-btn'),
        $centeredBtn = $('#centered-btn'),
        $zoomInBtn = $('#zoom-in-btn'),
        $zoomOutBtn = $('#zoom-out-btn'),
        $drawingState = $('#drawing-state'),
        $cursorX = $('#cursor-x'),
        $cursorY = $('#cursor-y');

    var $lineX = $('#line-x'),
        $lineY = $('#line-y');

    var drag = {
        client: [],
        origin: []
    };

    refreshSize();

    var diagraph = new Diagraph($canvas, SIZE);
    //var palette = new Palette($('#palette'));

    diagraph.on('drawingStart', function () {
        $drawingState.html('drawing...');
    });
    diagraph.on('drawingComplete', function () {
        $drawingState.html('complete.');
    });

    var Router = Backbone.Router.extend({
        routes: {
            ':x/:y/:zoom/:enableSmooth/:enableCrossCursor/:exprCode': 'main',
            '*otherwise': 'otherwise'
        },
        main: function (x, y, zoom, enableSmooth, enableCrossCursor, exprCode) {
            var origin = [Math.round(x), Math.round(y)];
            var zoomLevel = Math.round(zoom);
            var _zoom = parseZoom(zoomLevel);

            ZOOM_LEVEL = zoomLevel;
            Diagraph.SMOOTH = enableSmooth === ON;
            ENABLE_CROSS_CURSOR = enableCrossCursor === ON;
            EXPRESSIONS = parser.decompress(exprCode);

            diagraph.zoom(_zoom);
            diagraph.origin(parseOrigin(origin));

            refreshState();

            EXPRESSIONS.forEach(function (expr) {
                diagraph.pushExpression(new Expression(expr[0], expr[1]));
            });

            diagraph.redraw(SIZE);
        },
        otherwise: function () {
            refreshState(null, true);
        }
    });

    var router = new Router();

    Backbone.history.start({pushState: true});

    refreshSmoothBtn();
    refreshCrossCursorBtn();
    refreshZoomLevel();

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

    $centeredBtn.on('click', function (event) {
        event.stopPropagation();
        diagraph.redraw(false, 0);
        refreshState({origin: toOrigin(diagraph.origin())});
    });

    $zoomInBtn.on('click', function (event) {
        event.stopPropagation();
        onZoom(1, true);
    });

    $zoomOutBtn.on('click', function (event) {
        event.stopPropagation();
        onZoom(-1, true);
    });

    $smoothBtn.on('click', function (event) {
        event.stopPropagation();
        Diagraph.SMOOTH = !Diagraph.SMOOTH;
        refreshSmoothBtn();
        $smoothBtn.html();
        diagraph.redraw();
        refreshState({enableSmooth: Diagraph.SMOOTH ? ON : OFF});
    });

    $cursorBtn.on('click', function (event) {
        event.stopPropagation();
        ENABLE_CROSS_CURSOR = !ENABLE_CROSS_CURSOR;
        refreshCrossCursorBtn();
        if (!ENABLE_CROSS_CURSOR) {
            $lineX.css('left', '-99999px');
            $lineY.css('top', '-99999px');
        }
        refreshState({enableCrossCursor: ENABLE_CROSS_CURSOR ? ON : OFF});
    });

    function refreshSmoothBtn() {
        var title = 'Smooth: ' + (Diagraph.SMOOTH ? ON : OFF);
        $smoothBtn.html(title).attr('title', title);
        if (Diagraph.SMOOTH) {
            $smoothBtn.addClass(ON);
        } else {
            $smoothBtn.removeClass(ON);
        }
    }

    function refreshCrossCursorBtn() {
        var title = 'Cursor: ' + (ENABLE_CROSS_CURSOR ? ON : OFF);
        $cursorBtn.html(title).attr('title', title);

        if (ENABLE_CROSS_CURSOR) {
            $cursorBtn.addClass(ON);
        } else {
            $cursorBtn.removeClass(ON);
        }
    }

    function refreshZoomLevel() {
        var title = 'x' + ZOOM_LEVEL;
        $zoomLevel.html(title).attr('title', title);
        $zoomLevel.removeClass().addClass('x' + ZOOM_LEVEL);
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
        refreshState({origin: toOrigin(diagraph.origin())});
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

    function onZoom(delta, immed) {
        var _delta = delta > 0 ? 1 : -1;

        if (immed) {
            DELTA_SUM = 0;
            ZOOM_LEVEL += _delta;
            refreshDiagraphZoom(_delta);
        } else {
            DELTA_SUM += delta;
            if (Math.abs(DELTA_SUM) >= 1) {
                DELTA_SUM = 0;
                ZOOM_LEVEL += _delta;
                refreshDiagraphZoom(_delta);
            }
        }
    }

    function refreshDiagraphZoom(delta) {
        var zoom = parseZoom(ZOOM_LEVEL);
        diagraph.zoom(zoom);

        if (diagraph.zoom() === zoom) {
            diagraph.redraw();
            refreshZoomLevel();
            refreshState({zoom: ZOOM_LEVEL});
        } else {
            ZOOM_LEVEL -= delta;
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
            enableSmooth: Diagraph.SMOOTH ? ON : OFF,
            enableCrossCursor: ENABLE_CROSS_CURSOR ? ON : OFF,
            expr: parser.compress(EXPRESSIONS)
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