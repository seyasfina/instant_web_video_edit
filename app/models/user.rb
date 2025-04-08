class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_many :clips, dependent: :destroy
  has_many :video_histories, dependent: :destroy
  has_many :watched_videos, through: :video_histories, source: :video
  has_many :video_favorites, dependent: :destroy
  has_many :favorite_videos, through: :video_favorites, source: :video

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
end
