# Pin npm packages by running ./bin/importmap

pin "application"
pin "@rails/ujs", to: "@rails--ujs.js" # @7.1.3
pin "video_show"
pin "stimulus-autocomplete" # @3.1.0
pin "@hotwired/stimulus", to: "@hotwired--stimulus.js" # @3.2.2
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"
pin "sortablejs" # @1.15.6
