# frozen_string_literal: true

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
end

task default: :main
