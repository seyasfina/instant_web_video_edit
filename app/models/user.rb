class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :omniauthable, omniauth_providers: %i[google_oauth2]

  has_many :clips, dependent: :destroy
  has_many :video_histories, dependent: :destroy
  has_many :watched_videos, through: :video_histories, source: :video
  has_many :video_favorites, dependent: :destroy
  has_many :favorited_videos, through: :video_favorites, source: :video

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }

  def favorited?(video)
    video_favorites.exists?(video_id: video.id)
  end

  def self.from_omniauth(auth)
    user = find_by(provider: auth.provider, uid: auth.uid)
    return user if user

    user = find_by(email: auth.info.email)
    if user
      user.update(provider: auth.provider, uid: auth.uid)
      return user
    end

    create(
      email:    auth.info.email,
      password: Devise.friendly_token[0, 20],
      name:     auth.info.name,
      provider: auth.provider,
      uid:      auth.uid
    )
  end
end
