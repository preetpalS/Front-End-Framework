'use strict';

const fs = require('fs');
const JSDOM = require('jsdom').JSDOM;
const jsdom = new JSDOM(fs.readFileSync("test/index.html"));
const window = jsdom.window;

// Browser environment emulation
global.window = window;
global.document = window.document;

