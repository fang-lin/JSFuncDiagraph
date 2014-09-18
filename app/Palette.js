/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

(function () {

    function Palette($ele) {
        this.$ele = $ele;
        this.initColors();
        this.appendDom();
    }

    var _prototype_ = Palette.prototype;

    _prototype_.initColors = function () {
        var colors = [];
        for (var r = 0; r < 16; r+=2) {
            for (var g = 0; g < 16; g+=2) {
                for (var b = 0; b < 16; b+=2) {
                    colors.push('#' + r.toString(16) + g.toString(16) + b.toString(16));
                }
            }
        }
        this.colors = colors;
    };

    _prototype_.appendDom = function () {
        var $ele = this.$ele;
        this.colors.forEach(function (color) {
            $ele.append('<a style="background-color: ' + color + ';border-color: ' + color + ';" value="' + color + '"/>');
        });
    };

    window.Palette = Palette;
})();