class UsersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user, only: [ :show ]
  before_action :authorize_user, only: [ :show ]

  def show
    @video_histories = @user.video_histories.includes(:video).order(last_played_at: :desc)
    @video_favorites = @user.video_favorites.includes(:video).order(created_at: :desc)
  end

  private

  def set_user
    @user = User.find_by(id: params[:id])
    unless @user
      redirect_to root_path, alert: "ユーザーが見つかりません"
    end
  end

  def authorize_user
    unless @user == current_user
      redirect_to root_path, alert: "アクセス権限がありません"
    end
  end
end
