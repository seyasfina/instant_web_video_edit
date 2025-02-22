class ChangeVideoIdInVideos < ActiveRecord::Migration[7.2]
  def change
    change_column_null :videos, :video_id, false
    add_index :videos, :video_id, unique: true
  end
end
