# frozen_string_literal: true

class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def google_oauth2
    auth = request.env["omniauth.auth"]
    @user = User.from_omniauth(auth)

    if @user.persisted?
      sign_in_and_redirect @user, event: :authentication
      set_flash_message(:notice, :success, kind: "Google") if is_navigational_format?
    else
      session["devise.google_data"] = auth.except("extra")
      redirect_to new_user_registration_url, alert: "Google アカウントで登録できませんでした"
    end
  end

  def failure
    redirect_to root_path, alert: "Google ログインに失敗しました"
  end
end
