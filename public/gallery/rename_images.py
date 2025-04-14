# rename_images.py
import os
import random
import string
import sys

# --- Configuration ---
PREFIX_LENGTH = 6  # How many random characters to add at the beginning
ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'] # Add other extensions if needed
# --- End Configuration ---

def generate_random_prefix(length):
  """Generates a random alphanumeric prefix."""
  characters = string.ascii_lowercase + string.digits
  return ''.join(random.choice(characters) for i in range(length))

def rename_files_in_current_directory():
  """Renames image files in the directory where the script is located."""
  script_directory = os.path.dirname(os.path.abspath(__file__))
  print(f"Script running in: {script_directory}")
  print("Looking for image files to rename...")

  files_renamed = 0
  files_skipped = 0

  try:
    for filename in os.listdir(script_directory):
      # Construct full file path
      original_path = os.path.join(script_directory, filename)

      # Check if it's a file and has an allowed extension
      if os.path.isfile(original_path):
        _, ext = os.path.splitext(filename)
        if ext.lower() in ALLOWED_EXTENSIONS:

          # Basic check to avoid re-renaming (if it already looks like prefix_name.ext)
          # Adjust this check if your original filenames might contain underscores
          if len(filename.split('_')) > 1 and len(filename.split('_')[0]) == PREFIX_LENGTH:
             print(f"Skipping (already looks renamed): {filename}")
             files_skipped += 1
             continue

          # Generate a unique prefix (simple retry loop for this example)
          new_filename = ""
          attempts = 0
          while attempts < 10: # Avoid infinite loop in rare collision cases
            prefix = generate_random_prefix(PREFIX_LENGTH)
            new_filename = f"{prefix}_{filename}"
            new_path = os.path.join(script_directory, new_filename)
            if not os.path.exists(new_path): # Check if new name already exists
                break
            attempts += 1
          
          if os.path.exists(new_path):
              print(f"Skipping {filename} after multiple rename attempts failed (collision?).")
              files_skipped += 1
              continue


          # Rename the file
          try:
            os.rename(original_path, new_path)
            print(f"Renamed: '{filename}'  ->  '{new_filename}'")
            files_renamed += 1
          except OSError as e:
            print(f"Error renaming {filename}: {e}")
            files_skipped += 1
        else:
           # Optional: Print files that are not images being skipped
           # print(f"Skipping (not an image): {filename}")
           pass
      else:
          # Optional: Print directories being skipped
          # print(f"Skipping (directory): {filename}")
          pass


  except Exception as e:
    print(f"\nAn unexpected error occurred: {e}")

  print(f"\n--- Finished ---")
  print(f"Files renamed: {files_renamed}")
  print(f"Files skipped: {files_skipped}")

# --- Main execution ---
if __name__ == "__main__":
  # Safety confirmation
  print("\n*** WARNING ***")
  print("This script will RANDOMLY RENAME image files in the current directory.")
  print("Directory:", os.path.dirname(os.path.abspath(__file__)))
  print("Ensure you have a BACKUP of your images before proceeding.")

  confirm = input("Type 'yes' to continue: ")
  if confirm.lower() == 'yes':
    rename_files_in_current_directory()
  else:
    print("Operation cancelled.")