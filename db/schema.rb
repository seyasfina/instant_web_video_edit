# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2025_06_12_151709) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "clips", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "video_id", null: false
    t.float "start_time", null: false
    t.float "end_time", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_clips_on_user_id"
    t.index ["video_id"], name: "index_clips_on_video_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "encrypted_password", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "name", null: false
    t.string "provider"
    t.string "uid"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "video_favorites", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "video_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "video_id"], name: "index_video_favorites_on_user_id_and_video_id", unique: true
    t.index ["user_id"], name: "index_video_favorites_on_user_id"
    t.index ["video_id"], name: "index_video_favorites_on_video_id"
  end

  create_table "video_histories", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "video_id", null: false
    t.datetime "last_played_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "video_id"], name: "index_video_histories_on_user_id_and_video_id", unique: true
    t.index ["user_id"], name: "index_video_histories_on_user_id"
    t.index ["video_id"], name: "index_video_histories_on_video_id"
  end

  create_table "videos", force: :cascade do |t|
    t.string "url", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "video_id", null: false
    t.string "title"
    t.string "thumbnail_url"
    t.index ["url"], name: "index_videos_on_url", unique: true
    t.index ["video_id"], name: "index_videos_on_video_id", unique: true
  end

  add_foreign_key "clips", "users"
  add_foreign_key "clips", "videos"
  add_foreign_key "video_favorites", "users"
  add_foreign_key "video_favorites", "videos"
  add_foreign_key "video_histories", "users"
  add_foreign_key "video_histories", "videos"
end
