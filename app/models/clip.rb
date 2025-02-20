class Clip < ApplicationRecord
  belongs_to :user
  belongs_to :video

  validates :start_time, :end_time, presence: true
  validate :starttime_must_be_before_endtime

  private

  def starttime_must_be_before_endtime
    if start_time > end_time
      errors.add(:start_time, "は endtime より前に設定してください。")
    end
  end
end
