/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

define([], function () {
    'use strict';

    function Expression(literal, color) {
        this.color = '#' + (color || '#333').replace(/#/g, '');
        this.literal = {};
        this.split(this.calibrate(this.trim(literal)));
    }

    Expression.MATH_FUNC = {
        'Math.abs': 'abs',
        'Math.floor': 'floor',
        'Math.ceil': 'ceil',
        'Math.round': 'round',
        'Math.pow': 'pow',
        'Math.log': 'log',
        'Math.sin': 'sin',
        'Math.cos': 'cos',
        'Math.tan': 'tan',
        'Math.asin': 'arcs',
        'Math.acos': 'arcc',
        'Math.atan': 'arct',
        'Math.PI': 'PI',
        'Math.E': 'E'
    };

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
            console.error(err);
            func = null;
        }
        return func;
    };

    _prototype_.patterns = [{
        reg: Expression.DOMAIN_REG,
        fn: function (group) {
            if (group && group.length === 3) {
                var lower = new Function('return ' + group[1]);
                var upper = new Function('return ' + group[2]);
                this.literal.domain = [lower(), upper()];
                return false;
            }
            return true;
        }
    }, {
        reg: Expression.Y_X_REG,
        fn: function (group, literal) {
            if (group && this.functional(literal, Expression.VAR_X)) {
                this.literal = literal;
                return false;
            }
            return true;
        }
    }, {
        reg: Expression.Y_Q_REG,
        fn: function (group, literal) {
            if (group && this.functional(literal, Expression.VAR_Q)) {
                this.literal.y = literal;
                return false;
            }
            return true;
        }
    }, {
        reg: Expression.X_Q_REG,
        fn: function (group, literal) {
            if (group && this.functional(literal, Expression.VAR_Q)) {
                this.literal.x = literal;
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
    };

    _prototype_.trim = function (literal) {
        return literal.replace(/[\s\uFEFF\xA0\n\r]/g, '');
    };

    _prototype_.calibrate = function (literal) {
        var MATH_FUNC = Expression.MATH_FUNC;
        for (var func in MATH_FUNC) {
            if (MATH_FUNC.hasOwnProperty(func)) {
                literal = literal.replace(eval('/' + MATH_FUNC[func] + '/g'), func);
            }
        }
        return literal;
    };

    return Expression;
});