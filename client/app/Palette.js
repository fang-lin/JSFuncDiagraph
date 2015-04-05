/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

define([], function () {
    'use strict';

    function Palette($ele) {
        this.$ele = $ele;
        this.initColors()
            .appendDom()
            .onSelect();
    }

    var _prototype_ = Palette.prototype;

    _prototype_.initColors = function () {
        var colors = [];
        for (var r = 0; r < 16; r += 3) {
            for (var g = 0; g < 16; g += 3) {
                for (var b = 0; b < 16; b += 3) {
                    colors.push({
                        rgb: r.toString(16) + g.toString(16) + b.toString(16),
                        bright: (r > 6 && g > 6 && b > 6)
                    });
                }
            }
        }
        this.colors = colors;
        return this;
    };

    _prototype_.appendDom = function () {
        var $ele = this.$ele;
        this.colors.forEach(function (color) {
            var isBright = color.bright ? 'bright' : '';
            var rgb = color.rgb;
            $ele.append('<a style="background-color: #' + rgb + ';border-color: #' + rgb + ';" value="' + rgb + '" class="' + isBright + '" title="#' + rgb + '"/>');
        });
        return this;
    };

    _prototype_.onSelect = function () {
        var self = this;
        this.$ele.children('a').on('click', function (event) {
            var $a = $(this);
            if (self.$selected) {
                self.$selected.removeClass('selected');
            }
            self.$selected = $a;
            self.selectedColor = $a.attr('value');
            $a.addClass('selected');
        });
        return this;
    };

    return Palette;
});