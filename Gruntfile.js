module.exports = function(grunt) {
    require('load-grunt-config')(grunt);
    grunt.initConfig({
        connect: {
            server: {
                options: {
                    hostname: "*",
                    base: ".",
                    port: 8000
                }
            }
        },
        qunit: {
            all: {
                options: {
                    urls: [
                        'http://127.0.0.1:8000/tmp/index.html'
                    ],
                    console: false
                }
            }
        }
    });
    grunt.registerTask('test', ['connect', 'qunit']);
    grunt.registerTask('dist', 'Generates dist/ folder contents for release (only full framework currently supported)', () => {
        const child_process = require('child_process');
        const fs = require('fs');
        if (!fs.existsSync('./dist')) {
            fs.mkdirSync('./dist');
        }
        child_process.execSync('node node_modules/typescript/bin/tsc -d app/assets/javascripts/frontendframework/all.ts --types --outFile dist/frontendframework.js', {stdio: 'inherit'});
    });
    grunt.registerTask('clean', 'Removes build artifacts', () => {
        // TODO: Implement me.
        throw new Error('Not implemented.');
    });
    grunt.registerTask('test-preparation', 'Generates files needed to run test cases', () => {
        const child_process = require('child_process');
        const fs = require('fs');
        if (!fs.existsSync('./tmp')) {
            fs.mkdirSync('./tmp');
        }
        fs.copyFile('./test/index.html', './tmp/index.html', (error) => {
            if (error) throw error;
        });
        child_process.execSync('node node_modules/typescript/bin/tsc -d app/assets/javascripts/frontendframework-tests.ts --types --outFile tmp/frontendframework-tests.js', {stdio: 'inherit'});
    });
};
