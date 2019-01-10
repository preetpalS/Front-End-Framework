# frozen_string_literal: true

require 'fileutils'

BROWSERS = [
  {name: 'chrome', cmd_generator: -> (uri) { "chrome #{uri}" }},
  {name: 'firefox', cmd_generator: -> (uri) { "firefox file:///#{uri}" }}
]
TMP_DIR = 'tmp'
TMP_TEST_PAGE = "#{Dir.pwd}/tmp/index.html"

desc 'Generates type definition file'
task :generate_type_definition_file do
  cmd = <<~CMD
    node node_modules/typescript/bin/tsc -d app/assets/javascripts/frontendframework/all.ts --types --outFile frontendframework.js
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
      node node_modules/typescript/bin/tsc -d app/assets/javascripts/frontendframework/all.ts --types --outFile dist/frontendframework.js
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
  FileUtils.rm_rf(TMP_DIR) unless Dir.exist?(TMP_DIR)
end

task default: :main

task :prepare_test_page do
  Dir.mkdir(TMP_DIR) unless Dir.exist?(TMP_DIR)
  FileUtils.cp('test/index.html', TMP_TEST_PAGE)

  system <<~CMD
      node node_modules/typescript/bin/tsc -d app/assets/javascripts/frontendframework-tests.ts --types --outFile tmp/frontendframework-tests.js
  CMD

  puts "Test suite now ready to run in browsers by opening file: #{TMP_TEST_PAGE}"
end

task :test do
  BROWSERS.each do |browser|
    puts "Launching #{browser[:name]}"
    spawn browser[:cmd_generator].call(TMP_TEST_PAGE)
  end
end
