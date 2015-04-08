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

    function App() {
        this.init().refreshSize().onEvents().initRouter();
    }

    var _prototype_ = App.prototype;

    _prototype_.init = function () {
        this.RATIO = 1.4142135623730951;
        this.WHEEL_DAMP = 400;
        this.ZOOM_LEVEL = 7;
        this.CORNER_PADDING = 24;
        this.CURSOR_ON = true;
        this.DASHBOARD_ON = true;
        this.EDITOR_ON = false;
        this.DELTA_SUM = 0;
        this.ON = 'on';
        this.OFF = 'off';
        this.STATE_ON = '+';
        this.STATE_OFF = '-';
        this.EXPRESSIONS = [
            ['y=x', '', 1],
            ['y=x%2', '0f0'],
            //['y=10*sin(x)/x', 'f0f'],
            //['y=1/x', '393'],
            ['x=4*(sin(2*q)+0.2*sin(100*q))*cos(q);y=4*(sin(2*q)+0.2*sin(100*q))*sin(q);q=[0,2*PI]', '00f']
            //['x=4*cos(8*q)*cos(q);y=4*cos(8*q)*sin(q);q=[0,2*PI];', '0f0'],
            //['x=4*cos(2*q)*cos(q);y=4*cos(2*q)*sin(q);q=[0,2*PI];', '0ff'],
            //['x=q*cos(q);y=q*sin(q);q=[-1.5*PI,1.5*PI];', 'ff0'],
            //['x=6*cos(q);y=3*sin(q);q=[0,2*PI];', 'f0f']
        ];
        //this.EXPRESSIONS = [];

        this.$window = $(window);
        this.$body = $('body');
        this.$canvas = $('#canvas');

        this.$zoomLevel = $('#zoom-level');
        this.$smoothBtn = $('#smooth-btn');
        this.$cursorBtn = $('#cursor-btn');
        this.$centeredBtn = $('#centered-btn');
        this.$zoomInBtn = $('#zoom-in-btn');
        this.$zoomOutBtn = $('#zoom-out-btn');
        this.$dashboard = $('#dashboard');
        this.$dashboardToggleBtn = $('#dashboard-toggle-btn');
        this.$funcList = $('#func-list');
        this.$editor = $('#func-editor');
        this.$editorBg = $('#func-editor-bg');
        this.$funcTextarea = $('#func-textarea');
        this.$addFuncBtn = $('#add-func-btn');
        this.$closeEditorBtn = $('#close-func-editor-btn');
        this.$submitBtn = $('#submit-btn');

        this.$drawingState = $('#drawing-state');
        this.$cursorX = $('#cursor-x');
        this.$cursorY = $('#cursor-y');

        this.$lineX = $('#line-x');
        this.$lineY = $('#line-y');

        this.funcListCompiled = _.template($('#func-list-template').html());

        this.drag = {client: [], origin: []};

        this.diagraph = new Diagraph(this.$canvas, this.SIZE);
        this.palette = new Palette($('#palette'));

        return this;
    };

    _prototype_.initRouter = function () {
        var self = this;

        this.router = new (Backbone.Router.extend({
            routes: {
                ':x/:y/:zoom/:smoothOn/:cursorOn/:dashboardOn/:exprsEncode': 'main',
                '*otherwise': 'otherwise'
            },
            main: function (x, y, zoom, smoothOn, cursorOn, dashboardOn, exprsEncode) {

                var origin = [Math.round(x), Math.round(y)];
                var zoomLevel = Math.round(zoom);
                var _zoom = self.parseZoom(zoomLevel);

                self.ZOOM_LEVEL = zoomLevel;
                self.diagraph.SMOOTH = smoothOn === self.STATE_ON;
                self.CURSOR_ON = cursorOn === self.STATE_ON;
                self.DASHBOARD_ON = dashboardOn === self.STATE_ON;
                self.EXPRESSIONS = parser.decode(exprsEncode);

                self.diagraph.batchExpressions(self.EXPRESSIONS);

                self.refreshSmoothBtn(self.diagraph.SMOOTH);
                self.refreshCursorBtn(self.CURSOR_ON);
                self.refreshFuncList();
                self.refreshDashboard(self.DASHBOARD_ON);
                self.refreshEditor(self.EDITOR_ON);
                self.refreshZoomLevel(self.ZOOM_LEVEL);

                self.diagraph.zoom(_zoom);
                self.diagraph.origin(self.parseOrigin(origin));
                self.diagraph.redraw(self.SIZE);

                self.refreshState();
            },
            otherwise: function () {
                self.refreshState(null, true);
            }
        }))();

        Backbone.history.start({pushState: true});
        return this;
    };

    _prototype_.refreshFuncList = function () {
        var self = this;
        var funcLis = $(this.funcListCompiled({list: this.diagraph.expressions}));

        $('.edit-btn', funcLis).on('click', function (event) {
            event.stopPropagation();
            var index = $(this).attr('data-index');
            self.onEditFunc(index);
        });
        $('.delete-btn', funcLis).on('click', function (event) {
            event.stopPropagation();
            var index = $(this).attr('data-index');
            self.onDeleteFunc(index);
        });
        $('.show-on-btn', funcLis).on('click', function (event) {
            event.stopPropagation();
            var index = $(this).attr('data-index');
            self.onToggleFunc(index);
        });

        self.$funcList.html(funcLis);
    };

    _prototype_.onEvents = function () {
        var self = this;

        this.diagraph.on('drawing', function () {
            self.$drawingState.html('drawing...');
        }).on('completed', function () {
            self.$drawingState.html('');
        });

        $('#bl-panel button, #br-panel button, #dashboard, #func-editor, #func-editor-bg')
            .on('mousedown', function (event) {
                event.stopPropagation();
            }).on('mouseup', function (event) {
                event.stopPropagation();
            }).on('mousewheel', function (event) {
                event.stopPropagation();
            });

        this.$window
            .on('resize', _.throttle(function () {
                self.refreshSize();
                self.diagraph.redraw(self.SIZE);
            }, 800))
            .on('mousemove.crossCursor', function (event) {
                event.stopPropagation();
                self.onMouseMoveCrossCursor();
            })
            .on('mousedown', function (event) {
                event.stopPropagation();
                self.onDragStart(event);
                self.$window.on('mousemove.drag', function (event) {
                    self.onDragging(event);
                });
                self.$window.off('mousemove.crossCursor', function (event) {
                    self.onMouseMoveCrossCursor(event);
                });
            })
            .on('mouseup', function (event) {
                event.stopPropagation();
                self.$window.off('mousemove.drag');
                self.$window.on('mousemove.crossCursor', function (event) {
                    self.onMouseMoveCrossCursor();
                });
                self.onDragEnd(event);
            })
            .on('mousewheel', function (event) {
                event.stopPropagation();
                self.onZoom(event.deltaY * event.deltaFactor / self.WHEEL_DAMP);
                self.onMouseMoveCrossCursor();
            });

        this.$centeredBtn.on('click', function (event) {
            event.stopPropagation();
            self.diagraph.redraw(false, 0);
            self.refreshState({origin: self.toOrigin(self.diagraph.origin())});
        });

        this.$zoomInBtn.on('click', function (event) {
            event.stopPropagation();
            self.onZoom(1, true);
        });

        this.$zoomOutBtn.on('click', function (event) {
            event.stopPropagation();
            self.onZoom(-1, true);
        });

        this.$smoothBtn.on('click', function (event) {
            event.stopPropagation();
            self.diagraph.SMOOTH = !self.diagraph.SMOOTH;
            self.refreshSmoothBtn(self.diagraph.SMOOTH);
            self.diagraph.redraw();
            self.refreshState({smoothOn: self.diagraph.SMOOTH ? self.STATE_ON : self.STATE_OFF});
        });

        this.$cursorBtn.on('click', function (event) {
            event.stopPropagation();
            self.CURSOR_ON = !self.CURSOR_ON;
            self.refreshCursorBtn(self.CURSOR_ON);
            if (!self.CURSOR_ON) {
                self.$lineX.css('left', '9999px');
                self.$lineY.css('top', '9999px');
            }
            self.refreshState({cursorOn: self.CURSOR_ON ? self.STATE_ON : self.STATE_OFF});
        });

        this.$dashboardToggleBtn.on('click', function (event) {
            event.stopPropagation();
            self.DASHBOARD_ON = !self.DASHBOARD_ON;
            self.$dashboard.addClass('animate');
            self.refreshDashboard(self.DASHBOARD_ON);
            self.refreshState({dashboardOn: self.DASHBOARD_ON ? self.STATE_ON : self.STATE_OFF});
        });

        this.$addFuncBtn.on('click', function (event) {
            event.stopPropagation();
            if (!self.EDITOR_ON) {
                self.EDITOR_ON = true;
                self.$editor.addClass('animate');
                self.$funcTextarea.val('');
                self.palette.setSelectedRandom();
                self.refreshEditor(self.EDITOR_ON);
            }
        });

        this.$closeEditorBtn.on('click', function (event) {
            event.stopPropagation();
            if (self.EDITOR_ON) {
                self.EDITOR_ON = false;
                self.refreshEditor(self.EDITOR_ON);
            }
        });

        this.$submitBtn.on('click', function (event) {

            var expr = new Expression(self.$funcTextarea.val(), self.palette.selectedColor);

            if (self.editingFuncIndex == null) {
                // new add

                if (expr.error) {
                    console.log('error');
                } else {
                    self.diagraph.pushExpression(expr);
                    self.EXPRESSIONS = self.diagraph.getExpressionsArray();
                    self.refreshState({exprsEncode: parser.encode(self.EXPRESSIONS)});
                    self.refreshFuncList();
                    self.refreshDashboard(self.DASHBOARD_ON);
                    self.diagraph.drawExpression(expr);
                }

            } else {
                // edit
                console.log('edit');
            }
        });

        return this;
    };

    _prototype_.refreshSmoothBtn = function (smooth) {
        var title = 'Smooth: ' + (smooth ? this.ON : this.OFF);
        this.$smoothBtn.html(title).attr('title', title);

        if (smooth) {
            this.$smoothBtn.addClass(this.ON);
        } else {
            this.$smoothBtn.removeClass(this.ON);
        }

        return this;
    };

    _prototype_.refreshCursorBtn = function (cursorOn) {
        var title = 'Cursor: ' + (cursorOn ? this.ON : this.OFF);
        this.$cursorBtn.html(title).attr('title', title);

        if (cursorOn) {
            this.$cursorBtn.addClass(this.ON);
        } else {
            this.$cursorBtn.removeClass(this.ON);
        }

        return this;
    };

    _prototype_.refreshZoomLevel = function (zoomLevel) {
        var title = 'x' + zoomLevel;
        this.$zoomLevel.html(title).attr('title', title);
        this.$zoomLevel.removeClass().addClass('x' + zoomLevel);
    };

    _prototype_.refreshSize = function () {
        this.SIZE = [this.$body.width(), this.$body.height()];
        return this;
    };

    _prototype_.refreshDashboard = function (dashboardOn) {
        this.$dashboard.addClass('show');

        if (dashboardOn) {
            this.$dashboard.addClass(this.ON);
            this.$dashboard.css('top', '').css('right', '');
        } else {
            this.$dashboard.removeClass(this.ON);
            this.$dashboard
                .css('top', '-' + (this.$dashboard.height() - this.CORNER_PADDING) + 'px')
                .css('right', '-' + (this.$dashboard.width() - this.CORNER_PADDING) + 'px');
        }
        return this;
    };

    _prototype_.refreshEditor = function (editorOn) {
        this.$editor.addClass('show');
        if (editorOn) {
            this.$editor.addClass(this.ON);
            this.$editorBg.addClass(this.ON);
            this.$editor.css('top', '');
        } else {
            this.$editor.removeClass(this.ON);
            this.$editorBg.removeClass(this.ON);
            this.$editor.css('top', '-' + (this.$editor.height() + this.CORNER_PADDING) + 'px');
        }
        return this;
    };

    _prototype_.onDragStart = function (event) {
        this.$body.addClass('drag-start');
        this.drag.client = [event.clientX, event.clientY];
        this.drag.origin = this.diagraph.origin();
        this.$lineX.css('left', '9999px');
        this.$lineY.css('top', '9999px');
    };

    _prototype_.onDragging = function (event) {
        this.$body.removeClass('drag-start').addClass('dragging');
        this.$canvas.css('transform', 'translate(' + (event.clientX - this.drag.client[0]) + 'px,' + (event.clientY - this.drag.client[1]) + 'px)');
    };

    _prototype_.onDragEnd = function (event) {
        this.$body.removeClass('drag-start').removeClass('dragging');
        var offset = [
            this.drag.origin[0] + event.clientX - this.drag.client[0],
            this.drag.origin[1] + event.clientY - this.drag.client[1]
        ];
        this.$canvas.css('transform', 'translate(0,0)');
        this.diagraph.redraw(false, offset);
        this.refreshState({origin: this.toOrigin(this.diagraph.origin())});
    };

    _prototype_.onMouseMoveCrossCursor = function () {
        var origin = this.diagraph.origin();
        var zoom = this.diagraph.zoom();
        this.$cursorX.html((event.clientX - origin[0]) / zoom);
        this.$cursorY.html((origin[1] - event.clientY) / zoom);
        if (this.CURSOR_ON) {
            this.$lineX.css('left', event.clientX);
            this.$lineY.css('top', event.clientY);
        }
    };

    _prototype_.onZoom = function (delta, immed) {
        var _delta = delta > 0 ? 1 : -1;

        if (immed) {
            this.DELTA_SUM = 0;
            this.ZOOM_LEVEL += _delta;
            this.refreshDiagraphZoom(_delta);
        } else {
            this.DELTA_SUM += delta;
            if (Math.abs(this.DELTA_SUM) >= 1) {
                this.DELTA_SUM = 0;
                this.ZOOM_LEVEL += _delta;
                this.refreshDiagraphZoom(_delta);
            }
        }
        return this;
    };

    _prototype_.onEditFunc = function (index) {
        if (!this.EDITOR_ON) {
            this.EDITOR_ON = true;
            this.$editor.addClass('animate');

            var exp = this.diagraph.expressions[index];
            if (exp.domain) {
                this.$funcTextarea.val(exp.x + ';\n' + exp.y + ';\n' + exp.domain + ';');
            } else {
                this.$funcTextarea.val(exp + ';');
            }

            this.editingFuncIndex = index;
            this.palette.setSelected(this.palette.map[exp.rgb].$a);
            this.refreshEditor(this.EDITOR_ON);
        }
    };

    _prototype_.onDeleteFunc = function (index) {
        if (this.diagraph.deleteExpression(index)) {
            this.EXPRESSIONS = this.diagraph.getExpressionsArray();
            this.refreshState({exprsEncode: parser.encode(this.EXPRESSIONS)});
            this.refreshFuncList();
            this.refreshDashboard(this.DASHBOARD_ON);
        }
    };

    _prototype_.onToggleFunc = function (index) {
        var exp = this.diagraph.expressions[index];
        var $btn = $('li .show-on-btn', this.$funcList).eq(index);
        if (exp) {
            exp.hide = !exp.hide;
            if (exp.hide) {
                this.diagraph.erasure(exp);
                $btn.addClass('hide');
            } else {
                this.diagraph.drawExpression(exp);
                $btn.removeClass('hide');
            }
            this.EXPRESSIONS = this.diagraph.getExpressionsArray();
            this.refreshState({exprsEncode: parser.encode(this.EXPRESSIONS)});
        }
    };

    _prototype_.refreshDiagraphZoom = function (delta) {
        var zoom = this.parseZoom(this.ZOOM_LEVEL);
        this.diagraph.zoom(zoom);

        if (this.diagraph.zoom() === zoom) {
            this.diagraph.redraw();
            this.refreshZoomLevel(this.ZOOM_LEVEL);
            this.refreshState({zoom: this.ZOOM_LEVEL});
        } else {
            this.ZOOM_LEVEL -= delta;
        }

        return this;
    };

    _prototype_.refreshState = function (state, trigger) {
        if (this.ZOOM_LEVEL < 1) {
            this.ZOOM_LEVEL = 1;
        }

        if (this.ZOOM_LEVEL > 16) {
            this.ZOOM_LEVEL = 16;
        }

        var STATE_ON = this.STATE_ON, STATE_OFF = this.STATE_OFF;

        var _state = $.extend({
            origin: this.toOrigin(this.diagraph.origin()),
            zoom: Math.round(this.ZOOM_LEVEL),
            enableSmooth: this.diagraph.SMOOTH ? STATE_ON : STATE_OFF,
            enableCrossCursor: this.CURSOR_ON ? STATE_ON : STATE_OFF,
            dashboardOn: this.DASHBOARD_ON ? STATE_ON : STATE_OFF,
            exprsEncode: parser.encode(this.EXPRESSIONS)
        }, state);

        this.router.navigate(
            _state.origin[0] + '/' +
            _state.origin[1] + '/' +
            _state.zoom + '/' +
            _state.enableSmooth + '/' +
            _state.enableCrossCursor + '/' +
            _state.dashboardOn + '/' +
            _state.exprsEncode,
            {trigger: !!trigger}
        );

        return this;
    };

    _prototype_.parseZoom = function (level) {
        return Math.pow(this.RATIO, level + 1);
    };

    _prototype_.parseOrigin = function (origin) {
        var size = this.diagraph.size();

        return [
            size[0] / 2 + origin[0],
            size[1] / 2 + origin[1]
        ];
    };

    _prototype_.toOrigin = function (origin) {
        var size = this.diagraph.size();

        return [
            origin[0] - size[0] / 2,
            origin[1] - size[1] / 2
        ];
    };

    var app = new App();
    console.log(app);
});