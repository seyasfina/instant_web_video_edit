class Clip < ApplicationRecord
  belongs_to :user
  belongs_to :video

  validates :start_time, :end_time, presence: true
end
