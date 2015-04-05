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
    var CORNER_PADDING = 24;
    var CURSOR_ON = true;
    var DASHBOARD_ON = true;
    var EDITOR_ON = false;
    var DELTA_SUM = 0;
    var ON = 'on', OFF = 'off';
    var STATE_ON = 'o', STATE_OFF = 'x';
    var EXPRESSIONS = [
        //['y=x', 'f00'],
        //['y=10*sin(x)/x', 'f0f'],
        ['y=1/x', '393']
        //['x=4*(sin(2*q)+0.2*sin(100*q))*cos(q);y=4*(sin(2*q)+0.2*sin(100*q))*sin(q);q=[0,2*PI]', 'f00'],
        //['x=4*cos(8*q)*cos(q);y=4*cos(8*q)*sin(q);q=[0,2*PI];', '0f0'],
        //['x=4*cos(2*q)*cos(q);y=4*cos(2*q)*sin(q);q=[0,2*PI];', '0ff'],
        //['x=q*cos(q);y=q*sin(q);q=[-1.5*PI,1.5*PI];', 'ff0'],
        //['x=6*cos(q);y=3*sin(q);q=[0,2*PI];', 'f0f']
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
        $dashboard = $('#dashboard'),
        $dashboardToggleBtn = $('#dashboard-toggle-btn'),
        $funcList = $('#func-list'),
        $editor = $('#func-editor'),
        $editorBg = $('#func-editor-bg'),
        $addFuncBtn = $('#add-func-btn'),
        $closeEditorBtn = $('#close-func-editor-btn'),
        $editBtns = $('.edit-btn'),
        $deleteBtns = $('.delete-btn'),

        $drawingState = $('#drawing-state'),
        $cursorX = $('#cursor-x'),
        $cursorY = $('#cursor-y');

    var $lineX = $('#line-x'),
        $lineY = $('#line-y');

    var compiled = _.template($('#func-list-template').html());

    var drag = {
        client: [],
        origin: []
    };

    refreshSize();

    var diagraph = new Diagraph($canvas, SIZE);
    var palette = new Palette($('#palette'));

    diagraph.on('drawingStart', function () {
        $drawingState.html('drawing...');
    });
    diagraph.on('drawingComplete', function () {
        $drawingState.html('');
    });

    var Router = Backbone.Router.extend({
        routes: {
            ':x/:y/:zoom/:smoothOn/:cursorOn/:dashboardOn/:exprCode': 'main',
            '*otherwise': 'otherwise'
        },
        main: function (x, y, zoom, smoothOn, cursorOn, dashboardOn, exprCode) {
            var origin = [Math.round(x), Math.round(y)];
            var zoomLevel = Math.round(zoom);
            var _zoom = parseZoom(zoomLevel);

            ZOOM_LEVEL = zoomLevel;
            Diagraph.SMOOTH = smoothOn === STATE_ON;
            CURSOR_ON = cursorOn === STATE_ON;
            DASHBOARD_ON = dashboardOn === STATE_ON;
            EXPRESSIONS = parser.decompress(exprCode);

            refreshSmoothBtn(Diagraph.SMOOTH);
            refreshCursorBtn(CURSOR_ON);
            refreshDashboard(DASHBOARD_ON);
            refreshEditor(EDITOR_ON);
            refreshZoomLevel(ZOOM_LEVEL);

            diagraph.zoom(_zoom);
            diagraph.origin(parseOrigin(origin));

            refreshState();

            EXPRESSIONS.forEach(function (expr) {
                var expression = new Expression(expr[0], expr[1]);
                diagraph.pushExpression(expression);
            });

            $funcList.html(compiled({list: diagraph.expressions}));

            diagraph.redraw(SIZE);
        },
        otherwise: function () {
            refreshState(null, true);
        }
    });

    var router = new Router();

    Backbone.history.start({pushState: true});

    $('#bl-panel button, #br-panel button, #dashboard, #func-editor, #func-editor-bg')
        .on('mousedown', function (event) {
            event.stopPropagation();
        }).on('mouseup', function (event) {
            event.stopPropagation();
        }).on('mousewheel', function (event) {
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
        refreshSmoothBtn(Diagraph.SMOOTH);
        diagraph.redraw();
        refreshState({smoothOn: Diagraph.SMOOTH ? STATE_ON : STATE_OFF});
    });

    $cursorBtn.on('click', function (event) {
        event.stopPropagation();
        CURSOR_ON = !CURSOR_ON;
        refreshCursorBtn(CURSOR_ON);
        if (!CURSOR_ON) {
            $lineX.css('left', '99999px');
            $lineY.css('top', '99999px');
        }
        refreshState({cursorOn: CURSOR_ON ? STATE_ON : STATE_OFF});
    });

    $dashboardToggleBtn.on('click', function (event) {
        event.stopPropagation();
        DASHBOARD_ON = !DASHBOARD_ON;
        $dashboard.addClass('animate');
        refreshDashboard(DASHBOARD_ON);
        refreshState({dashboardOn: DASHBOARD_ON ? STATE_ON : STATE_OFF});
    });

    $addFuncBtn.on('click', function (event) {
        event.stopPropagation();
        if (!EDITOR_ON) {
            EDITOR_ON = true;
            $editor.addClass('animate');
            refreshEditor(EDITOR_ON);
        }
    });

    $editBtns.on('click', function (event) {
        event.stopPropagation();
        if (!EDITOR_ON) {
            EDITOR_ON = true;
            $editor.addClass('animate');
            refreshEditor(EDITOR_ON);
        }
    });

    $closeEditorBtn.on('click', function (event) {
        event.stopPropagation();
        if (EDITOR_ON) {
            EDITOR_ON = false;
            refreshEditor(EDITOR_ON);
        }
    });

    function refreshSmoothBtn(soomth) {
        var title = 'Smooth: ' + (soomth ? ON : OFF);
        $smoothBtn.html(title).attr('title', title);

        if (soomth) {
            $smoothBtn.addClass(ON);
        } else {
            $smoothBtn.removeClass(ON);
        }
    }

    function refreshCursorBtn(cursorOn) {
        var title = 'Cursor: ' + (cursorOn ? ON : OFF);
        $cursorBtn.html(title).attr('title', title);

        if (cursorOn) {
            $cursorBtn.addClass(ON);
        } else {
            $cursorBtn.removeClass(ON);
        }
    }

    function refreshZoomLevel(zoomLevel) {
        var title = 'x' + zoomLevel;
        $zoomLevel.html(title).attr('title', title);
        $zoomLevel.removeClass().addClass('x' + zoomLevel);
    }

    function refreshSize() {
        SIZE = [$body.width(), $body.height()];
    }

    function refreshDashboard(dashboardOn) {
        $dashboard.addClass('show');
        if (dashboardOn) {
            $dashboard.addClass(ON);
            $dashboard.css('top', '').css('right', '');
        } else {
            $dashboard.removeClass(ON);
            $dashboard
                .css('top', '-' + ($dashboard.height() - CORNER_PADDING) + 'px')
                .css('right', '-' + ($dashboard.width() - CORNER_PADDING) + 'px');
        }
    }

    function refreshEditor(editorOn) {
        $editor.addClass('show');
        if (editorOn) {
            $editor.addClass(ON);
            $editorBg.addClass(ON);
            $editor.css('top', '');
        } else {
            $editor.removeClass(ON);
            $editorBg.removeClass(ON);
            $editor.css('top', '-' + ($editor.height() + CORNER_PADDING) + 'px');
        }
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
        if (CURSOR_ON) {
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
            refreshZoomLevel(ZOOM_LEVEL);
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
            enableSmooth: Diagraph.SMOOTH ? STATE_ON : STATE_OFF,
            enableCrossCursor: CURSOR_ON ? STATE_ON : STATE_OFF,
            dashboardOn: DASHBOARD_ON ? STATE_ON : STATE_OFF,
            expr: parser.compress(EXPRESSIONS)
        }, state);

        router.navigate(
            _state.origin[0] + '/' +
            _state.origin[1] + '/' +
            _state.zoom + '/' +
            _state.enableSmooth + '/' +
            _state.enableCrossCursor + '/' +
            _state.dashboardOn + '/' +
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
});