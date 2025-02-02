class CreateVideos < ActiveRecord::Migration[7.2]
  def change
    create_table :videos do |t|
      t.string :url, null: false

      t.timestamps
    end

    add_index :videos, :url, unique:true
  end
end
