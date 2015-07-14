/*jslint stupid: true*/
/*global describe, it*/

(function () {
    'use strict';

    var _ = require('lodash'),

        expect = require('chai').expect,

        // Get all test templates
        templates = require('./spec-utils').getTemplates(),

        Composer = require('../source/composer');

    describe('Compiled', function () {

        _.forIn(templates, function (template) {

            it('Ok: Compiled of ' + template.filename, function () {
                var compiled = Composer.compose(template.expect.AST);

                expect(compiled).to.equal(template.expect.Compiled);
            });

        });

    });

}());
