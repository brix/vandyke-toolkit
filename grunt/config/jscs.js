'use strict';

module.exports = {
    dev: {
        options: {
            config: '.jscsrc'
        },
        files: {
            src: [
                '<%= meta.cwdAll %>.js',
                '!<%= meta.buildAll %>',
                '!<%= meta.testAll %>',
                '!<%= meta.npmAll %>'
            ]
        }
    }
};
