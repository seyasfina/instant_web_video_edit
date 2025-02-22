require "test_helper"

class VideosControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @video = videos(:one)
    @user = users(:one)
    sign_in @user 
  end

  test "should get new" do
    get new_video_url
    assert_response :success
  end

  test "should create video if not exists" do
    video_params = { url: "https://www.youtube.com/watch?v=new123" }
    assert_difference('Video.count', 1) do
      post videos_url, params: { video: video_params }
    end
    assert_response :redirect
    follow_redirect!
    assert_response :success
  end

  test "should redirect to existing video if already exists" do
    video_params = { url: @video.url }
    post videos_url, params: { video: video_params }
    assert_response :redirect
    follow_redirect!
    assert_equal video_path(@video), request.path
    assert_response :success
  end

  test "should render new on create failure" do
    video_params = { url: "" }
    post videos_url, params: { video: video_params }
    assert_response :success
    assert_template :new
  end

  test "should show video" do
    get video_url(@video)
    assert_response :success
  end
end
