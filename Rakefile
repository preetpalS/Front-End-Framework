# frozen_string_literal: true

# Rakefile

require_relative './lib/frontendframework'

require 'blade'
require 'erubis'
require 'sprockets'
require 'typescript-sprockets'

# TypeScript compiler options
::Typescript::Sprockets::TypescriptProcessor.register
::Typescript::Sprockets::TypescriptProcessor.options(
  compiler_flags: ::Typescript::Sprockets::TypescriptProcessor::DEFAULT_COMPILER_FLAGS.reject do |x|
    ['--allowJs', '--checkJs'].include?(x)
  end
)

namespace :blade do
  task :build do
    system <<~CMD
      node node_modules/typescript/bin/tsc -d app/assets/javascripts/frontendframework/all.js.ts --types #{Typescript::Sprockets::TypescriptProcessor.options[:compiler_flags].join(' ')} --outFile tmp/frontendframework.js
CMD
  end

  desc 'Runs blade runner'
  task runner: :build do
    Blade.start(interface: :runner)
  end
end

desc 'Generates type definition file'
task :generate_type_definition_file do
  cmd = <<~CMD
    node node_modules/typescript/bin/tsc -d app/assets/javascripts/frontendframework/all.js.ts --types #{Typescript::Sprockets::TypescriptProcessor.options[:compiler_flags].join(' ')} --outFile frontendframework.js
CMD
  puts "Executing command: #{cmd}"
  system cmd
  puts 'Deleting generated file: frontendframework.js'
  File.delete 'frontendframework.js'
  puts 'Generated: frontendframework.d.ts'
end

desc 'Generates dist/ folder contents for release (only full framework currently supported)'
task :dist do
  Dir.mkdir('dist') unless Dir.exist?('dist')
  system <<~CMD
      node node_modules/typescript/bin/tsc -d app/assets/javascripts/frontendframework/all.js.ts --types #{Typescript::Sprockets::TypescriptProcessor.options[:compiler_flags].join(' ')} --outFile dist/frontendframework.js
  CMD
end

task :clean do
  [
    'dist/frontendframework.js',
    'dist/frontendframework.d.ts',
    'frontendframework.d.ts'
  ].each do |f|
    File.delete(f) if File.exist?(f)
  end
end

task default: :main
