require 'frontendframework/header_script'
require 'frontendframework/version'

module FrontEndFramework
  class Engine < ::Rails::Engine
    isolate_namespace FrontEndFramework
  end
end
