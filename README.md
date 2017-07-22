
# Front-End Framework

*Please note that this is a WORK-IN-PROGRESS and is NOT stable.*

Some SASS and TypeScript code that I extracted from some of the websites that I have built.

Intended to work with all modern browsers (Chrome, Edge, FireFox, IE (IE11), Opera, Safari).

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'frontendframework',
    git: 'https://github.com/preetpalS/Front-End-Framework.git',
    tag: '0.6.5',
    require: 'frontendframework'

# For compiling TypeScript
gem 'typescript-sprockets',
    git: 'https://github.com/preetpalS/typescript-sprockets.git',
    tag: '0.6.1',
    require: 'typescript-sprockets'
```

And then execute:

    $ bundle

*Usage instructions will become available as library becomes more stable.*

## Getting Started (Development)

Run bundler (`bundle`). Run npm (`npm install`). Fetch submodules (`git submodule update --init --recursive`). Run tests with `bundle exec rake blade:runner`

Requires having a working Node.js and Ruby development environment available.

Note that if you are using the TypeScript `--outFile` which concatenates and emits output to a single file, do not require framework components individually (require
`framework/all` only). If you want to require framework components individually (assuming that you are not using the TypeScript `--outFile` option), explicitly look
at the references in the source file for the specific component.
