lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)

require 'frontendframework/version'

Gem::Specification.new do |gem|
  gem.name = 'frontendframework'
  gem.version = Frontendframework::VERSION
  gem.platform = Gem::Platform::RUBY
  gem.authors = ['Preetpal Sohal']
  gem.email = %w(preetpal.sohal@gmail.com)

  gem.files         = `git ls-files`.split($/)
  gem.executables   = gem.files.grep(%r{^bin/}).map{ |f| File.basename(f) }
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})
  gem.require_paths = ['lib']

  gem.required_ruby_version = '>= 2.0.0'
end
