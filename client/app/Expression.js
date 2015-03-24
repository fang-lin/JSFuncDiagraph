/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

define([], function () {
    'use strict';

    function Expression(literal, color) {
        this.split(this.calibrate(this.trim(literal)));
        this.color = color || '#333';
    }

    Expression.MATH_FUNC = {
        'Math.abs': /abs/g,
        'Math.floor': /floor/g,
        'Math.ceil': /ceil/g,
        'Math.round': /round/g,
        'Math.pow': /pow/g,
        'Math.log': /log/g,
        'Math.sin': /sin/g,
        'Math.cos': /cos/g,
        'Math.tan': /tan/g,
        'Math.asin': /arcs/g,
        'Math.acos': /arcc/g,
        'Math.atan': /arct/g,
        'Math.PI': /PI/g,
        'Math.E': /E/g
    };

    var _prototype_ = Expression.prototype;

    _prototype_.functional = function (literal) {
        var func;
        try {
            func = new Function('x', 'return ' + literal + ';');
        } catch (e) {
            func = null;
        }
        return func;
    };

    _prototype_.split = function (literal) {
        var literals = [];
        literal.split(';').forEach(function (_literal) {
            if (_literal) {
                literals.push(_literal);
            }
        });
        if (literals.length === 1) {
            this.literal = literals[0];
            this.func = this.functional(literals[0]);
        }
        if (literals.length === 3) {
            //parametric equation
            //todo: parametric equation
            this.literals = literals;
            this.domin = [0, 1];
        }
    };

    _prototype_.trim = function (literal) {
        return literal.replace(/[\s\uFEFF\xA0\n\r]/g, '');
    };

    _prototype_.calibrate = function (literal) {
        var MATH_FUNC = Expression.MATH_FUNC;
        var _literal = literal;
        for (var func in MATH_FUNC) {
            if (MATH_FUNC.hasOwnProperty(func)) {
                _literal = _literal.replace(MATH_FUNC[func], func);
            }
        }
        return _literal;
    };

    return Expression;
});