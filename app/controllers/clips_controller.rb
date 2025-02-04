class ClipsController < ApplicationController
  before_action :set_video

  def create
    @clip = @video.clips.new(clip_params)
    if @clip.save
      render json: @clip, status: :created
    else
      render json: { errors: @clip.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    @clip = @video.clips.find(params[:id])
    if @clip.update(clip_params)
      render json: @clip
    else
      render json: { errors: @clip.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @clip = @video.clips.find(params[:id])
    @clip.destroy
    head :no_content
  end

  private

  def set_video
    @video = Video.find(params[:video_id])
  end

  def clip_params
    params.require(:clip).permit(:start_time, :end_time)
  end
end