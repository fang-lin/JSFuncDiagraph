/**
 * Copyright 2006-2014 GrapeCity inc
 * Author: isaac.fang@grapecity.com
 */

define([
    'underscore'
], function (_) {
    'use strict';

    function Palette($ele) {
        this.$ele = $ele;
        this.map = {};
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
                        bright: (r + g + b > 21)
                    });
                }
            }
        }
        this.colors = colors;
        return this;
    };

    _prototype_.appendDom = function () {
        var $ele = this.$ele;
        var map = this.map;
        this.colors.forEach(function (color) {
            var isBright = color.bright ? 'bright' : '';
            var rgb = color.rgb;
            var $a = $('<a style="background-color: #' + rgb + ';border-color: #' + rgb + ';" value="' + rgb + '" class="' + isBright + '" title="#' + rgb + '"/>');
            color.$a = $a;
            map[rgb] = color;
            $ele.append($a);
        });
        return this;
    };

    _prototype_.onSelect = function () {
        var self = this;
        this.$ele.children('a').on('click', function () {
            self.setSelected($(this));
        });
        return this;
    };

    _prototype_.setSelected = function ($a) {
        if (this.$selected) {
            this.$selected.removeClass('selected');
        }
        this.$selected = $a;
        this.selectedColor = $a.attr('value');
        $a.addClass('selected');
        return this;
    };

    _prototype_.getRandomColor = function () {
        var max = this.colors.length - 1;
        return this.colors[_.random(0, max)];
    };

    _prototype_.setSelectedRandom = function () {
        var max = this.colors.length - 1;
        var $a = this.$ele.children('a').eq(_.random(0, max));
        this.setSelected($a);
        return this;
    };

    return Palette;
});