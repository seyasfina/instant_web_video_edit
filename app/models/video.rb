class Video < ApplicationRecord
  has_many :clips, dependent: :destroy
  has_many :video_histories, dependent: :destroy
  has_many :users_who_watched, through: :video_histories, source: :user
  has_many :video_favorites, dependent: :destroy
  has_many :users_who_favorited, through: :video_favorites, source: :user

  before_validation :set_video_id

  validates :url, presence: true, uniqueness: true, format: { with: /\Ahttps:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+\z/, message: "は有効なYouTubeのURLを入力してください" }
  validates :video_id, presence: true, uniqueness: true

  after_create_commit :enqueue_metadata_fetch_job

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

  private

  def enqueue_metadata_fetch_job
    FetchYoutubeMetadataJob.perform_later(id)
  end
end
