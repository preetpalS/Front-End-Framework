
# Rakefile

require_relative './lib/frontendframework'

require 'blade'
require 'erubis'
require 'sprockets'
require 'typescript-sprockets'

# TypeScript compiler options
::Typescript::Sprockets::TypescriptProcessor.register
# Not overloading any defaults of library
# ::Typescript::Sprockets::TypescriptProcessor.options()

namespace :blade do
  task :build do
    system <<CMD
node node_modules/typescript/bin/tsc -d app/assets/javascripts/frontendframework/all.js.ts --types #{Typescript::Sprockets::TypescriptProcessor.options[:compiler_flags].join(' ')} --outFile tmp/frontendframework.js
CMD
  end

  desc 'Runs blade runner'
  task runner: :build do
    Blade.start(interface: :runner)
  end
end

namespace :update do
  desc 'Updates ./app/assets/javascripts/frontendframework/all.js.ts with new file references'
  task :all_js_ts do
    ts_lib_files_directory_path = File.join(
      File.dirname(__FILE__),
      'app/assets/javascripts/frontendframework'
    )
    all_js_ts_filename = "all.js.ts"
    all_js_ts_filepath = File.join(ts_lib_files_directory_path, all_js_ts_filename)

    # Assumes all sources are:
    #   - Written in TypeScript
    #   - End in a '.js.ts' extension
    #   - Are at the top-level of the `ts_lib_files_directory_path`
    ts_lib_file_logical_paths = Dir.new(
      ts_lib_files_directory_path
    ).entries.select do |f|
      (!['.', '..', all_js_ts_filename].include?(f)) && (f.end_with? '.js.ts')
    end.map do |fp|
      fp[0..-7] # Removes '.js.ts' extension
    end

    File.write all_js_ts_filepath, Erubis::Eruby.new(ALL_JS_TS_ERB).result({ts_lib_files: ts_lib_file_logical_paths})
  end
end

desc 'Generates type definition file'
task :generate_type_definition_file do
  cmd = <<CMD
node node_modules/typescript/bin/tsc -d app/assets/javascripts/frontendframework/all.js.ts --types #{Typescript::Sprockets::TypescriptProcessor.options[:compiler_flags].join(' ')} --outFile frontendframework.js
CMD
  puts "Executing command: #{cmd}"
  system cmd
  puts 'Deleting generated file: frontendframework.js'
  File.delete 'frontendframework.js'
  puts 'Generated: frontendframework.d.ts'
end

task default: :main

ALL_JS_TS_ERB = <<ERB
<% ts_lib_files.each do |ts_lib_file| %>
//= require ./<%= ts_lib_file %>
<% end %>

<% ts_lib_files.each do |ts_lib_file| %>
/// <reference path="./<%= ts_lib_file %>.js.ts"/>
<% end %>

// Note that the above references do not work if you have the TypeScript compiler set to remove comments.
// Use something like the uglifier gem for removing comments/obfuscation.

// Also note that require order does not consider dependency chain. Therefore, dependencies between files
// must not be affected by a random load order.

// AUTO-GENERATED by a Rake task, do not edit by hand.

namespace FrontEndFramework { export const VERSION = '<%= FrontEndFramework::VERSION %>'; }
ERB
