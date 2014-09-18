/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

$(function () {

    var diagraph = new JSFuncDiagraph($('#canvas'), [800, 400]);
    var expression = new Expression('y = 1/x');
//    var expression = new Expression('y = Math.tan(x)');

    diagraph.pushExpression(expression);
    diagraph.drawExpression(expression);

});