class CreateVideoFavorrites < ActiveRecord::Migration[7.2]
  def change
    create_table :video_favorrites do |t|
      t.references :user, null: false, foreign_key: true
      t.references :video, null: false, foreign_key: true

      t.timestamps
    end
    add_index :video_favorrites, [:user_id, :video_id], unique: true
  end
end
