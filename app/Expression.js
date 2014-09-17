/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

(function () {
    function Expression(literal) {
        this.literal = literal;
        this.functional();
    }

    var _prototype_ = Expression.prototype;

    _prototype_.functional = function () {
        this.func = new Function('x', 'return ' + this.literal + ';');
    };

    window.Expression = Expression;
})();