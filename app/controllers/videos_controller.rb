class VideosController < ApplicationController
  def new
    @video = Video.new
  end

  def create
    existing_video = Video.find_by(url: video_params[:url])
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
    @clips = @video.clips
  end

  private

  def video_params
    params.require(:video).permit(:url)
  end
end
