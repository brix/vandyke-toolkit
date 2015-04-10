'use strict';

module.exports = {
    dev: {
        files: {
            src: [
                '<%= meta.cwdAll %>.json',
                '!<%= meta.buildAll %>',
                '!<%= meta.npmAll %>'
            ]
        }
    },
    build: {
        files: {
            src: [
                '<%= meta.buildAll %>.json'
            ]
        }
    }
};
