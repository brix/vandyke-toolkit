var fs = require('fs'),

    Parser = require('../source/parser'),
    Traverser = require('../source/traverser'),
    Composer = require('../source/composer'),

    source = fs.readFileSync('./test/test.vandyke').toString(),

    ast = Parser.parse(source);



console.log(JSON.stringify(ast, null, 4));

/*
Traverser.traverse(ast, {
    enter: function (node) {
        console.log('enter:', node.type);
    },
    leave: function (node) {
        console.log('leave:', node.type);
    }
});
*/

console.log(Composer.compose(ast));
