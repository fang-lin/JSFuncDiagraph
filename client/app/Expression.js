/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

define(function () {
    'use strict';

    function Expression(literal, color, hide) {
        this.rgb = (color || '#333').replace(/#/g, '');
        this.color = '#' + this.rgb;
        this.hide = hide === Expression.STATE_ON;
        this.literal = {};
        this.expression = {};
        this.split(this.calibrate(this.trim(literal)));
    }

    Expression.STATE_ON = '+';
    Expression.STATE_OFF = '-';

    Expression.MATH_FUNC = [
        ['Math.abs', 'abs'],
        ['Math.floor', 'floor'],
        ['Math.ceil', 'ceil'],
        ['Math.round', 'round'],
        ['Math.pow', 'pow'],
        ['Math.log', 'log'],
        ['a@r@c@s@i@n', 'arcsin'],
        ['a@r@c@c@o@s', 'arccos'],
        ['a@r@c@t@a@n', 'arctan'],
        ['Math.sin', 'sin'],
        ['Math.cos', 'cos'],
        ['Math.tan', 'tan'],
        ['Math.asin', 'a@r@c@s@i@n'],
        ['Math.acos', 'a@r@c@c@o@s'],
        ['Math.atan', 'a@r@c@t@a@n'],
        ['Math.PI', 'PI'],
        ['Math.E', 'E']
    ];

    Expression.OPTS = [
        ['=', ' = '],
        [',', ', ']
        //['\\+', ' + '],
        //['-', ' - '],
        //['\\*', ' * '],
        //['\\/', ' / '],
        //['%', ' % ']
    ];

    Expression.VAR_X = 'x';
    Expression.VAR_Q = 'q';
    Expression.DOMAIN_REG = /q=\[(.+),(.+)]/;
    Expression.Y_X_REG = /y=.*x.*/;
    Expression.Y_Q_REG = /y=.*q.*/;
    Expression.X_Q_REG = /x=.*q.*/;

    var _prototype_ = Expression.prototype;

    _prototype_.functional = function (literal, varName) {
        var func;
        try {
            func = new Function(varName, 'return ' + literal + ';');
        } catch (err) {
            this.error = err;
            func = null;
        }
        return func;
    };

    _prototype_.patterns = [{
        reg: Expression.DOMAIN_REG,
        fn: function (group, literal) {
            if (group && group.length === 3) {
                var lower = new Function('return ' + group[1]);
                var upper = new Function('return ' + group[2]);
                this.literal.domain = [lower(), upper()];
                this.expression.domain = this.format(literal);
                return false;
            }
            return true;
        }
    }, {
        reg: Expression.Y_X_REG,
        fn: function (group, literal) {
            var fn = this.functional(literal, Expression.VAR_X);
            if (group && fn) {
                this.literal = literal;
                this.expression = this.format(literal);
                this.func = fn;
                return false;
            }
            return true;
        }
    }, {
        reg: Expression.Y_Q_REG,
        fn: function (group, literal) {
            var fn = this.functional(literal, Expression.VAR_Q);
            if (group && fn) {
                this.literal.y = literal;
                this.expression.y = this.format(literal);
                this.func = fn;
                return false;
            }
            return true;
        }
    }, {
        reg: Expression.X_Q_REG,
        fn: function (group, literal) {
            if (group && this.functional(literal, Expression.VAR_Q)) {
                this.literal.x = literal;
                this.expression.x = this.format(literal);
                return false;
            }
            return true;
        }
    }];

    _prototype_.split = function (literal) {
        var self = this;
        var literals = literal.split(';')
            .map(function (item) {
                return item;
            }).filter(function (item) {
                return item;
            });
        var patterns = self.patterns;

        literals.forEach(function (literal) {
            var i = 0, keep;
            do {
                var pattern = patterns[i];
                keep = pattern.fn.call(self, literal.match(pattern.reg), literal);
                i++;
            } while (keep && i < patterns.length);
        });

        if (typeof this.literal === 'object' && !this.literal.domain) {
            this.error = true;
        }
    };

    _prototype_.trim = function (literal) {
        return literal.replace(/[\s\uFEFF\xA0\n\r]/g, '');
    };

    _prototype_.calibrate = function (literal) {
        var MATH_FUNC = Expression.MATH_FUNC;
        MATH_FUNC.forEach(function (func) {
            literal = literal.replace(new RegExp(func[1], 'g'), func[0]);
        });
        return literal;
    };

    _prototype_.format = function (literal) {
        var OPTS = Expression.OPTS;
        var MATH_FUNC = Expression.MATH_FUNC;
        OPTS.forEach(function (opt) {
            literal = literal.replace(new RegExp(opt[0], 'g'), opt[1]);
        });
        MATH_FUNC.reverse().forEach(function (func) {
            literal = literal.replace(new RegExp(func[0], 'g'), func[1]);
        });
        return literal;
    };

    return Expression;
});