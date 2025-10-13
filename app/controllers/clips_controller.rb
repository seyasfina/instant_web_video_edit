class ClipsController < ApplicationController
  before_action :authenticate_user!, only: [ :update, :destroy, :sync, :reorder ]
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

  def sync
    clips_payload = params.require(:clips)
    video_id_from_path = @video.id

    success = 0
    synced = []

    Clip.transaction do
      clips_payload.each do |c|
        next unless c[:video_id].to_i == video_id_from_path

        clip = @video.clips.new(
          user:       current_user,
          title:      c[:title].to_s,
          start_time: c[:start_time].to_f,
          end_time:   c[:end_time].to_f,
        )
        if clip.save
          success += 1
          synced << clip
        end
      end
    end

    render json: {
      message: "#{success}個のクリップを同期しました",
      success_count: success,
      synced_clips: synced
    }, status: :ok
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
    @clip = @video.clips.where(user: current_user).find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "指定されたクリップが見つからないか、アクセス権限がありません" }, status: :not_found
  end

  def clip_params
    params.require(:clip).permit(:start_time, :end_time, :title)
  end
end
