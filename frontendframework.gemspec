# frozen_string_literal: true

lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)

require 'frontendframework/version'

Gem::Specification.new do |gem|
  gem.name = 'frontendframework'
  gem.version = FrontEndFramework::VERSION
  gem.platform = Gem::Platform::RUBY
  gem.authors = ['Preetpal Sohal']
  gem.email = %w[preetpal.sohal@gmail.com]

  gem.summary       = 'Front-End Framework.'
  gem.description   = 'Some SASS and TypeScript code that I extracted from some of the websites that I have built.'
  gem.homepage      = 'https://github.com/preetpalS/Front-End-Framework'
  gem.license       = 'MIT'

  gem.files         = `git ls-files`.split($INPUT_RECORD_SEPARATOR)
  gem.executables   = gem.files.grep(%r{^bin/}).map { |f| File.basename(f) }
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})
  gem.require_paths = ['lib']

  gem.required_ruby_version = '>= 2.0.0'
end
