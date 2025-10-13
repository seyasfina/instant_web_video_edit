require "application_system_test_case"

class VideoClipsFlowTest < ApplicationSystemTestCase
  setup do
    @user = users(:one)
    @video = videos(:one)
    Clip.delete_all
  end

  teardown do
    Clip.delete_all
  end

  test "user creates a clip from the video page" do
    visit new_user_session_path
    fill_in "メールアドレス", with: @user.email
    fill_in "パスワード", with: "password"
    click_button "ログイン"

    visit video_path(@video)

    within "#clip-form" do
      fill_in "clip_start_time", with: "00:00.00"
      fill_in "clip_end_time", with: "00:10.00"
      fill_in "clip_title", with: "イントロ"
      click_button "クリップを保存"
    end

    assert_selector "#clip-count", text: "1 件", wait: 5

    within "#clip-list" do
      assert_text "イントロ"
      assert_text "00:00.00"
      assert_text "00:10.00"
    end
  end
end
