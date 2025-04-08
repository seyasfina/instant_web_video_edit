class VideoFavorite < ApplicationRecord
  belongs_to :user
  belongs_to :video

  validates :user_id, uniqueness: { scope: :video_id, message: "この動画はお気に入り済みです" }
  validates :user_id, presence: true
  validates :video_id, presence: true
end
