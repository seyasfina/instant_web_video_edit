require "test_helper"

class VideoFavoritesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    sign_in @user
    @video = videos(:two)
  end

  test "should create video_favorite" do
    assert_difference("VideoFavorite.count", 1) do
      post video_video_favorite_url(@video), as: :json
    end

    assert_response :created
  end

  test "should destroy video_favorite" do
    favorite = video_favorites(:one)

    assert_difference("VideoFavorite.count", -1) do
      delete video_video_favorite_url(favorite.video), as: :json
    end

    assert_response :ok
  end
end
