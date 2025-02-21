Rails.application.routes.draw do
  root "videos#new"

  devise_for :users

  resources :users, only: [ :show ]
  resources :videos, only: [ :new, :create, :show ] do
    resources :clips, only: [ :create, :update, :destroy ], defaults: { format: :json }
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/*
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
end
