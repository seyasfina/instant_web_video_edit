class VideosController < ApplicationController
  def new
    @video = Video.new
  end

  def create
    temp_video = Video.new(video_params)
    submitted_video_id = temp_video.extract_video_id

    existing_video = Video.find_by(video_id: submitted_video_id)
    if existing_video
      redirect_to video_path(existing_video)
    else
      @video = Video.new(video_params)
      if @video.save
        redirect_to @video
      else
        render :new
      end
    end
  end

  def show
    @video = Video.find(params[:id])
    @clips = @video.clips.where(user: current_user).includes(:user)
  end

  private

  def video_params
    params.require(:video).permit(:url)
  end
end
