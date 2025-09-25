class UsersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user, only: [ :show ]

  def show
    @video_histories = @user.video_histories.includes(:video).order(last_played_at: :desc)
    @video_favorites = @user.video_favorites.includes(:video).order(created_at: :desc)
  end

  private

  def set_user
    @user = current_user
  end
end
