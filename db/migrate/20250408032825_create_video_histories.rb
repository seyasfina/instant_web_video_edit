class CreateVideoHistories < ActiveRecord::Migration[7.2]
  def change
    create_table :video_histories do |t|
      t.references :user, null: false, foreign_key: true
      t.references :video, null: false, foreign_key: true
      t.datetime :last_played_at

      t.timestamps
    end
    add_index :video_histories, [:user_id, :video_id], unique: true
  end
end
