
# Rakefile
require "blade"
require 'sprockets'
require 'typescript-sprockets'

::Typescript::Sprockets::TypescriptProcessor.register

namespace :blade do
  desc 'Runs blade runner'
  task :runner do
    Blade.start(interface: :runner)
  end
end

task default: :main
