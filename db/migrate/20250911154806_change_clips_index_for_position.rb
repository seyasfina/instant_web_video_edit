class ChangeClipsIndexForPosition < ActiveRecord::Migration[7.2]
  def change
    remove_index :clips, name: "index_clips_on_vid_uid_position"

    add_index :clips, [:video_id, :user_id, :position]
  end
end
