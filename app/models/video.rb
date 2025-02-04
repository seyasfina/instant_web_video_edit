class Video < ApplicationRecord
  has_many :clips, dependent: :destroy

  validates :url, presence: true, uniqueness: true, format: { with: /\Ahttps:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/, message: "は有効なYouTubeのURLを入力してください" }

  def embed_url
    if url.include?("youtube.com/watch?v=")
      video_id = url.split("v=").last.split("&").first
      "https://www.youtube.com/embed/#{video_id}"
    elsif url.include?("youtu.be/")
      video_id = url.split("/").last
      "https://www.youtube.com/embed/#{video_id}"
    else
      url
    end
  end
end
