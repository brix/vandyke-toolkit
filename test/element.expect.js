'use strict';

module.exports = {
    AST: {
        'type': 'AST',
        'body': [
            {
                'type': 'Element',
                'elementOpening': {
                    'type': 'ElementOpening',
                    'name': {
                        'type': 'Identifier',
                        'name': 'div'
                    },
                    'attributes': [],
                    'selfClosing': true
                }
            },
            {
                'type': 'Text',
                'value': '\n'
            }
        ]
    }
};
