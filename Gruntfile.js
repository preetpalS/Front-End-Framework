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
        child_process.execSync('node node_modules/typescript/bin/tsc -d javascripts/all.ts --types --outFile dist/frontendframework.js', {stdio: 'inherit'});
    });
    grunt.registerTask('clean', 'Removes build artifacts', () => {
        const fs = require('fs');

        var relevantFiles = [
            './dist/frontendframework.d.ts',
            './dist/frontendframework.js',
            './tmp/frontendframework-tests.d.ts',
            './tmp/frontendframework-tests.js',
            './tmp/index.html'
        ];

        for (let i = 0; i < relevantFiles.length; i++) {
            const file = relevantFiles[i];
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        }

        var relevantDirectories = ['./dist/', './tmp/'];
        for (let i = 0; i < relevantDirectories.length; i++) {
            const directory = relevantDirectories[i];
            if (fs.existsSync(directory)) {
                fs.rmdirSync(directory);
            }
        }
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
        child_process.execSync('node node_modules/typescript/bin/tsc -d test/frontendframework-tests.ts --types --outFile tmp/frontendframework-tests.js', {stdio: 'inherit'});
    });
};
