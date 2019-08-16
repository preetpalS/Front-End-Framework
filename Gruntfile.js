
const gruntSetup = (grunt) => {
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
};

const distTask = () => {
    const child_process = require('child_process');
    const fs = require('fs');
    if (!fs.existsSync('./dist')) {
        fs.mkdirSync('./dist');
    }
    child_process.execSync('node node_modules/typescript/bin/tsc', {stdio: 'inherit'});
};

const cleanTask = () => {
    // TODO: Updated clean task.
    throw new Error("Task needs to be updated.");
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
};

module.exports = (grunt) => {
    require('load-grunt-config')(grunt);
    gruntSetup(grunt);
    grunt.registerTask('dist', 'Generates dist/ folder contents for release (only full framework currently supported)', distTask);
    grunt.registerTask('clean', 'Removes build artifacts', cleanTask);
};
