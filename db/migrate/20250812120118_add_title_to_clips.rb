class AddTitleToClips < ActiveRecord::Migration[7.2]
  def change
    add_column :clips, :title, :string
  end
end
