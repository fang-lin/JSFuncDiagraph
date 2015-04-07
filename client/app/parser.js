/**
 * Copyright 2006-2015 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

define([
    'lz-string'
], function () {
    'use strict';

    LZString._keyStrBase64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-=';
    var SEPARATOR = ['|', '#'];

    var parser = {};

    parser.encode = function (expressions) {
        var str = '';

        if (expressions && expressions.length) {
            str = expressions.map(function (expression) {
                return expression.join(SEPARATOR[1]);
            }).join(SEPARATOR[0]);
        }

        return LZString.compressToBase64(str);
    };

    parser.decode = function (base64Code) {
        var str = LZString.decompressFromBase64(base64Code);
        if (str) {
            return str.split(SEPARATOR[0]).map(function (expression) {
                return expression.split(SEPARATOR[1]);
            });
        } else {
            return [];
        }
    };

    return parser;
});