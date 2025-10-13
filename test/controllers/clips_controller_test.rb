require "test_helper"

class ClipsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @user = users(:one)
    sign_in @user
    @clip = clips(:one)
    @video = @clip.video
  end

  test "should create clip" do
    post video_clips_url(@video), params: { clip: {
      user_id: @user.id,
      video_id: @video.id,
      start_time: 1.5,
      end_time: 1.5
    } }
    assert_response :created
  end

  test "should update clip" do
    patch video_clip_url(@video, @clip), params: { clip: {
      user_id: @user.id,
      video_id: @video.id,
      start_time: 2.0,
      end_time: 2.5
    } }
    assert_response :success
  end

  test "should destroy clip" do
    delete video_clip_url(@video, @clip)
    assert_response :no_content
  end

  test "should require authentication for sync" do
    sign_out @user
    post sync_video_clips_url(@video), params: { clips: [] }, as: :json

    assert_response :unauthorized
  end

  test "should sync clips for current video" do
    @video.clips.destroy_all
    other_video = videos(:two)

    payload = [
      { video_id: @video.id, start_time: 0.5, end_time: 4.5, title: "Intro" },
      { video_id: @video.id, start_time: 5.0, end_time: 9.5, title: "Outro" },
      { video_id: other_video.id, start_time: 1.0, end_time: 2.0, title: "Skip" }
    ]

    assert_difference("@video.clips.where(user: @user).count", 2) do
      post sync_video_clips_url(@video), params: { clips: payload }, as: :json
    end

    assert_response :success

    body = JSON.parse(response.body)
    assert_equal 2, body["success_count"]
    assert_includes body.fetch("message", ""), "2個"
    assert_equal [ "Intro", "Outro" ],
                 @video.clips.where(user: @user).order(:position).pluck(:title)
  end

  test "should require authentication for reorder" do
    sign_out @user

    patch reorder_video_clips_url(@video), params: { order: [ @clip.id ] }, as: :json

    assert_response :unauthorized
  end

  test "should reorder clips" do
    @video.clips.destroy_all
    clip1 = create_clip(start_time: 0.0, end_time: 4.0)
    clip2 = create_clip(start_time: 4.0, end_time: 8.0)
    clip3 = create_clip(start_time: 8.0, end_time: 12.0)

    patch reorder_video_clips_url(@video),
          params: { order: [ clip3.id, clip1.id, clip2.id ] },
          as: :json

    assert_response :success
    assert_equal [ clip3.id, clip1.id, clip2.id ],
                 @video.clips.where(user: @user).order(:position).pluck(:id)
  end

  private

  def create_clip(start_time:, end_time:, title: nil)
    @video.clips.create!(
      user: @user,
      start_time: start_time,
      end_time: end_time,
      title: title
    )
  end
end
