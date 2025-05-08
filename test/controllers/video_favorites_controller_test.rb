require "test_helper"

class VideoFavoritesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @video = videos(:one)
  end
  
  test "should create video_favorite" do
    post video_video_favorite_url(@video), as: :json
    assert_response :success
  end
  
  test "should destroy video_favorite" do
    delete video_video_favorite_url(@video), as: :json
    assert_response :success
  end
end
