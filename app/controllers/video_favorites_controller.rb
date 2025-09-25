class VideoFavoritesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_video, only: [ :create, :destroy ]
  before_action :set_video_favorite, only: [ :destroy ]

  def create
    @video_favorite = current_user.video_favorites.new(video: @video)
    if @video_favorite.save
      render json: @video_favorite, status: :created
    else
      render json: { errors: @video_favorite.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    if @video_favorite.destroy
      render json: { message: "お気に入り動画を削除しました" }, status: :ok
    else
      render json: { errors: @video_favorite.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_video
    @video = Video.find(params[:video_id])
  end

  def set_video_favorite
    @video_favorite = current_user.video_favorites.find_by(video_id: params[:video_id])
  end
end
