class ClipsController < ApplicationController
  before_action :authenticate_user!, only: [ :update, :destroy ]
  before_action :set_video
  before_action :set_clip, only: [ :update, :destroy ]

  def create
    @clip = @video.clips.new(clip_params)
    @clip.user = current_user

    if @clip.save
      render json: @clip, status: :created
    else
      render json: { errors: @clip.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @clip.update(clip_params)
      render json: @clip, status: :ok
    else
      render json: @clip.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @clip.destroy

    head :no_content
  end

  def reorder
    ids = params.permit(order: []).fetch(:order, []).filter_map { |v| Integer(v) rescue nil }
    clips = @video.clips.where(user: current_user, id: ids).index_by(&:id)

    Clip.transaction do
      ids.each_with_index do |id, index|
        if clip = clips[id]
          clip.update!(position: index + 1)
        end
      end
    end
  end

  private

  def set_video
    @video = Video.find(params[:video_id])
  end

  def set_clip
    @clip = @video.clips.find(params[:id])
  end

  def clip_params
    params.require(:clip).permit(:start_time, :end_time, :title)
  end
end
