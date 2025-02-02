class Video < ApplicationRecord
  has_many :clips, dependent: :destroy

  validates :url, presence: true, uniqueness: true, format: URI::regexp(%w[http https])

end
