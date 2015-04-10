'use strict';

module.exports = {
    build: {
        files: [{
            expand: true,
            cwd: '<%= meta.source %>',
            ext: '.js',
            src: ['**/*'],
            dest: '<%= meta.build %>'
        }]
    }
};
