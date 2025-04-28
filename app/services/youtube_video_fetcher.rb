class YoutubeVideoFetcher
  require 'google/apis/youtube_v3'

  def initialize(video)
    @video = video
    @youtube = Google::Apis::YoutubeV3::YouTubeService.new
    @youtube.key = ENV['YOUTUBE_API_KEY']
  end

  def fetch_metadata
    resp = @youtube.list_videos('snippet', id: @video.video_id)
    item = resp.items.first
    return nil unless item
    
    {
      title: item.snippet.title,
      thumbnail_url: item.snippet.thumbnails.default.url
    }
  rescue Google::Apis::ClientError => e
    Rails.logger.error("YouTube API error: #{e.message}")
    nil
  end
end
