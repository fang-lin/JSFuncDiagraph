/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

$(function () {

    var diagraph = new JSFuncDiagraph($('#canvas'));
    var expression = new Expression('y = 1/x');

    diagraph.setCanvasSize(800, 600);
    diagraph.pushExpression(expression);

    diagraph.drawExpression(expression);

});