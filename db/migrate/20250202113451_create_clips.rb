class CreateClips < ActiveRecord::Migration[7.2]
  def change
    create_table :clips do |t|
      t.references :user, null: false, foreign_key: true
      t.references :video, null: false, foreign_key: true
      t.float :start_time, null:false
      t.float :end_time, null:false

      t.timestamps
    end
  end
end
