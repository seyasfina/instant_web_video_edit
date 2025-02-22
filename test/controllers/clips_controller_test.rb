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
end
