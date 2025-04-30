class Clip < ApplicationRecord
  belongs_to :user
  belongs_to :video

  validates :start_time, :end_time, presence: true
  validate :starttime_must_be_before_endtime

  def seconds_to_hms(seconds)
    seconds = seconds.to_f
    h = (seconds / 3600).floor
    m = ((seconds % 3600) / 60).floor
    s = seconds % 60

    if h == 0
      format("%02d:%05.2f", m, s)
    else
      format("%02d:%02d:%05.2f", h, m, s)
    end
  end

  private

  def starttime_must_be_before_endtime
    if start_time > end_time
      errors.add(:base, "開始時間は終了時間より前に設定してください。")
    end
  end
end
