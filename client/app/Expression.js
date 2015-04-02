/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

define([], function () {
    'use strict';

    function Expression(literal, color) {
        this.split(this.calibrate(this.trim(literal)));
        this.color = '#' + (color || '#333').replace(/#/g, '');
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

    Expression.VAR_X = 'x';
    Expression.VAR_Q = 'q';
    Expression.DOMAIN_REG = /q=\[(.+),(.+)]/;
    Expression.Y_X_EXPR = /y=/;
    Expression.Y_Q_EXPR = /y=/;
    Expression.X_Q_EXPR = /x=/;

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

    _prototype_.split = function (literal) {
        var literals = literal.split(';')
            .map(function (item) {
                return item;
            }).filter(function (item) {
                return item;
            });

        if (literals.length === 1) {
            // 一般情况直接处理
            if (this.functional(literals[0], Expression.VAR_X)) {
                this.literal = literals[0];
            }
        } else if (literals.length > 1) {
            // 有可能是一组方式或参数方程
            literals.forEach(function (literal) {
                // 通过正则表达式进行匹配和提取

                //if (literal.indexOf(Expression.VAR_X) > -1) {
                //    // 普通方程
                //} else if (literal.indexOf(Expression.VAR_Q) > 1) {
                //    // 参数方程
                //} else if (literal.indexOf(Expression.VAR_Q) === 0) {
                //    // 参数方程的值域
                //}
                //if (literal.indexOf(Expression.VAR_Q)) {
                //
                //}
                //return literal.indexOf(Expression.VAR_Q) > 1;
            });

        }
        //if (literals.length === 1) {
        //    this.literal = literals[0];
        //    this.func = this.functional(literals[0]);
        //}
        //if (literals.length === 3) {
        //    //parametric equation
        //    //todo: parametric equation
        //    this.literals = literals;
        //    this.domin = [0, 1];
        //}
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