require "test_helper"

class ClipsControllerTest < ActionDispatch::IntegrationTest
  test "should get create" do
    get clips_url(@clip)
    assert_response :success
  end

  test "should get update" do
    get clips_url(@clip)
    assert_response :success
  end

  test "should get destroy" do
    get clips_url(@clip)
    assert_response :success
  end
end
