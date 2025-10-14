class Clip < ApplicationRecord
  belongs_to :user
  belongs_to :video

  validates :start_time, :end_time, presence: true
  validate :clip_times_must_be_numeric
  validate :starttime_must_be_before_endtime

  scope :ordered, -> { order(position: :asc, id: :asc) }

  before_create :assign_tail_position

  after_destroy :collapse_positions!

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
    return unless valid_time?(start_time) && valid_time?(end_time)

    if start_time > end_time
      errors.add(:base, "開始時間は終了時間より前に設定してください。")
    end
  end

  def clip_times_must_be_numeric
    { start_time: start_time, end_time: end_time }.each do |attribute, value|
      next if valid_time?(value)

      errors.add(attribute, "には有効な数値を指定してください。")
    end
  end

  def valid_time?(value)
    value.is_a?(Numeric) && value.finite?
  end

  def assign_tail_position
    max = Clip.where(video_id:, user_id:).maximum(:position) || 0
    self.position = max + 1
  end

  def collapse_positions!
    video.with_lock do
      self.class.where(video_id: video_id, user_id: user_id)
                .where("position > ?", position)
                .update_all("position = position - 1")
    end
  end
end
