require "test_helper"

class VideoFavoritesControllerTest < ActionDispatch::IntegrationTest
  test "should get create" do
    get video_favorites_create_url
    assert_response :success
  end

  test "should get destroy" do
    get video_favorites_destroy_url
    assert_response :success
  end
end
