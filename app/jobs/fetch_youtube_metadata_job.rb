class FetchYoutubeMetadataJob < ApplicationJob
  queue_as :default

  def perform(video_id)
    video = Video.find(video_id)
    return unless video
    meta = YoutubeVideoFetcher.new(video).fetch_metadata
    video.update(meta) if meta.present?
  end
end
