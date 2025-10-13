require "test_helper"

class ClipTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @video = videos(:one)
    Clip.delete_all
  end

  test "start time must be before end time" do
    clip = Clip.new(user: @user, video: @video, start_time: 12.0, end_time: 4.0)

    assert_not clip.valid?
    assert_includes clip.errors.full_messages,
                    "開始時間は終了時間より前に設定してください。"
  end

  test "assigns next tail position on create" do
    first = Clip.create!(user: @user, video: @video, start_time: 0.0, end_time: 5.0)
    second = Clip.create!(user: @user, video: @video, start_time: 5.0, end_time: 10.0)

    assert_equal 1, first.position
    assert_equal 2, second.position
  end

  test "collapses positions after destroy" do
    clip1 = Clip.create!(user: @user, video: @video, start_time: 0.0, end_time: 5.0)
    clip2 = Clip.create!(user: @user, video: @video, start_time: 5.0, end_time: 10.0)
    clip3 = Clip.create!(user: @user, video: @video, start_time: 10.0, end_time: 15.0)

    clip2.destroy

    remaining = @video.clips.order(:position).pluck(:id, :position).to_h

    assert_equal({ clip1.id => 1, clip3.id => 2 }, remaining)
    assert_equal 2, clip3.reload.position
  end
end
