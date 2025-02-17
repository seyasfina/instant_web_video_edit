class Clip < ApplicationRecord
  belongs_to :user
  belongs_to :video

  validates :start_time, :end_time, presence: true
  validate :starttime_must_be_before_endtime

  private

  def starttime_must_be_before_endtime
    if start_time.blank? || end_time.blank?
      errors.add(:base, "開始時間と終了時間の両方を入力してください。")
    elsif start_time > end_time
      errors.add(:start_time, "は endtime より前に設定してください。")
    end
  end  
end
