require "test_helper"

class ClipsControllerTest < ActionDispatch::IntegrationTest
  test "should get create" do
    get clips_create_url
    assert_response :success
  end

  test "should get update" do
    get clips_update_url
    assert_response :success
  end

  test "should get destroy" do
    get clips_destroy_url
    assert_response :success
  end
end
