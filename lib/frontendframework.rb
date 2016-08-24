require 'frontendframework/header_script'
require 'frontendframework/version'

module FrontEndFramework
  if defined?(::Rails) && defined?(::Rails::Engine)
    class Engine < ::Rails::Engine
      isolate_namespace FrontEndFramework
    end
  end
end
