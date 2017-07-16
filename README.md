
# Front-End Framework

*Please note that this is a WORK-IN-PROGRESS and is NOT stable.*

Some SASS and TypeScript code that I extracted from some of the websites that I have built.

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'frontendframework',
    git: 'https://github.com/preetpalS/Front-End-Framework.git',
    tag: '0.5.1',
    require: 'frontendframework'

# For compiling TypeScript
gem 'typescript-sprockets',
    git: 'https://github.com/preetpalS/typescript-sprockets.git',
    tag: '0.5.0',
    require: 'typescript-sprockets'
```

And then execute:

    $ bundle

*Usage instructions will become available as library becomes more stable.*

## Getting Started (Development)

Run bundler (`bundle`). Run npm (`npm install`). Fetch submodules (`git submodule update --init --recursive`). Run tests with `bundle exec rake blade:runner`

Requires having a working Node.js and Ruby development environment available.
