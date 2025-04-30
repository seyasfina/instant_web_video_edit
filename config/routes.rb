Rails.application.routes.draw do
  root "videos#new"

  devise_for :users, controllers: {
    omniauth_callbacks: "users/omniauth_callbacks",
    registrations: "users/registrations"
  }

  resources :users, only: [ :show ]
  resources :videos, only: [ :new, :create, :index, :show ] do
    collection do
      get :autocomplete
    end
    resources :clips, only: [ :create, :update, :destroy ], defaults: { format: :json }
    resource :video_favorite, only: [ :create, :destroy ], defaults: { format: :json }
  end

  get "/404", to: "errors#not_found"
  get "/500", to: "errors#internal_server_error"

  match "*path", to: "errors#not_found", via: :all
end
