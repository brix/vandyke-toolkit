/*jslint stupid: true*/
/*global describe, it*/

(function () {
    'use strict';

    var _ = require('lodash'),

        expect = require('chai').expect,

        // Get all test templates
        templates = require('./spec-utils').getTemplates(),

        Parser = require('../source/parser');

    describe('AST', function () {

        _.forIn(templates, function (template) {

            it('Ok: AST of ' + template.filename, function () {
                var ast = Parser.parse(template.source);

                expect(ast).to.deep.equal(template.expect.AST);
            });

        });

    });

}());
