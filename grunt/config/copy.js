'use strict';

module.exports = {
    build: {
        files: [{
            expand: false,
            cwd: '<%= meta.cwd %>',
            src: [
                'README.md',
                'CONTRIBUTING.md',
                'license.md'
            ],
            dest: '<%= meta.build %>'
        }]
    }
};
