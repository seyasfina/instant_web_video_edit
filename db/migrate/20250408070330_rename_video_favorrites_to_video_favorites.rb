class RenameVideoFavorritesToVideoFavorites < ActiveRecord::Migration[7.2]
  def change
    rename_table :video_favorrites, :video_favorites
  end
end
