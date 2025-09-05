class AddColumnToClips < ActiveRecord::Migration[7.2]
  def up
    add_column :clips, :position, :integer

    execute <<~SQL
      WITH ranked AS (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY video_id, user_id
                 ORDER BY created_at ASC, id ASC
               ) AS rn
        FROM clips
      )
      UPDATE clips
         SET position = ranked.rn
      FROM ranked
      WHERE clips.id = ranked.id;
    SQL

    change_column_null :clips, :position, false

    add_index :clips, [:video_id, :user_id, :position],
              unique: true,
              name: "index_clips_on_vid_uid_position"
  end

  def down
    remove_index :clips, name: "index_clips_on_vid_uid_position"
    remove_column :clips, :position
  end
end
