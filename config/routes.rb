Rails.application.routes.draw do
  root "videos#new"

  devise_for :users, controllers: {
    omniauth_callbacks: "users/omniauth_callbacks",
    registrations: "users/registrations"
  }

  controller :static_pages do
    get "terms"   => :terms,   as: :terms
    get "privacy" => :privacy, as: :privacy
  end

  resource :user, only: [ :show ], path: "you"
  resources :videos, only: [ :new, :create, :index, :show ] do
    collection do
      get :autocomplete
    end
    resources :clips, only: [ :create, :update, :destroy ], defaults: { format: :json } do
      collection do
        patch :reorder, defaults: { format: :json }
        post :sync, defaults: { format: :json }
      end
    end
    resource :video_favorite, only: [ :create, :destroy ], defaults: { format: :json }
  end

  get "/404", to: "errors#not_found"
  get "/500", to: "errors#internal_server_error"

  match "*path", to: "errors#not_found", via: :all
end
