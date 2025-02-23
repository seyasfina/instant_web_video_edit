class UsersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user, only: [:show]
  before_action :authorize_user, only: [:show]

  def show
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
