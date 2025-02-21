class Video < ApplicationRecord
  has_many :clips, dependent: :destroy

  before_validation :set_video_id

  validates :url, presence: true, uniqueness: true, format: { with: /\Ahttps:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/, message: "は有効なYouTubeのURLを入力してください" }
  validates :video_id, presence: true, uniqueness: true

  def set_video_id
    self.video_id = extract_video_id if url.present?
  end

  def extract_video_id
    if url.include?("youtube.com/watch?v=")
      url.split("v=").last.split("&").first
    elsif url.include?("youtu.be/")
      url.split("/").last
    else
      nil
    end
  end

  def embed_url
    "https://www.youtube.com/embed/#{video_id}?enablejsapi=1" if video_id
  end
end