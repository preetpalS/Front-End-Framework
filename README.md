[![Build Status](https://travis-ci.org/preetpalS/Front-End-Framework.svg?branch=master)](https://travis-ci.org/preetpalS/Front-End-Framework) [![Maintainability](https://api.codeclimate.com/v1/badges/9867ac1c979ba60bd137/maintainability)](https://codeclimate.com/github/preetpalS/Front-End-Framework/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/9867ac1c979ba60bd137/test_coverage)](https://codeclimate.com/github/preetpalS/Front-End-Framework/test_coverage)

# Front-End Framework

*Please note that this is a WORK-IN-PROGRESS and is NOT stable.*

Some SASS and TypeScript code that I extracted from some of the
websites that I have built.

Intended to work with all modern browsers (Chrome, Edge, FireFox, IE
(IE11), Opera, Safari).

Currently migrating code to make use of ES6 modules.

## Installation

Installing using NPM or Yarn.

*Usage instructions will become available as library becomes more stable.*

## Getting Started (Development)

Requires having a working Node.js development environment available.

The test suite can be run using the `yarn run test` command. The test
suite is known to work on Windows and should work on Linux, macOS and
FreeBSD.

## Code Conventions

### Compiler Options

This library should compile with the strictest TypeScript compiler settings.

### Linting Tools

Currently TSLint is configured. No TSLint issues should be present in
releases (see tsconfig.json).

### File Names

Using only lowercase names with underscores as delimiters for
JavaScript and TypeScript files (files containing a single interface
only are prefixed with i_).

Sass files have lowercase name delimited with hyphens (filenames for
partials are prefixed with an underscore).
