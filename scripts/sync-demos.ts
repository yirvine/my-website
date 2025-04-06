import { promises as fs } from 'fs';
import path from 'path';

// --- Configuration ---
// IMPORTANT: Update this path if your Dropbox folder is different
const sourceDir = '/Users/yeneirvine/Dropbox/TWIST/yen exports post frequency';
// Calculate __dirname equivalent for ESM - REMOVED
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const targetDir = path.join(__dirname, '../../public/audio/demos'); // Go up one more level
const jsonOutputFile = path.join(__dirname, '../../public/demos.json'); // Go up one more level
const maxDemos = 50; // How many of the latest demos to include
// --- End Configuration ---

async function syncDemos() {
  console.log(`Starting demo sync from: ${sourceDir}`);

  try {
    // Ensure target directory exists
    await fs.mkdir(targetDir, { recursive: true });
    console.log(`Ensured target directory exists: ${targetDir}`);

    // Read source directory
    let allFiles;
    try {
        allFiles = await fs.readdir(sourceDir);
    } catch (err) {
        const error = err as Error;
        console.error(`Error reading source directory ${sourceDir}: ${error.message}`);
        console.error("Please ensure the path is correct and you have permissions.");
        process.exit(1); // Exit if source can't be read
    }

    // Filter for MP3 files and get stats
    const mp3Files = [];
    for (const file of allFiles) {
      if (path.extname(file).toLowerCase() === '.mp3') {
        const sourceFilePath = path.join(sourceDir, file);
        try {
            const stats = await fs.stat(sourceFilePath);
            if (stats.isFile()) {
                mp3Files.push({
                    name: file,
                    mtime: stats.mtime, // Modification time
                    sourcePath: sourceFilePath,
                });
            }
        } catch (statErr) {
             const error = statErr as Error;
             console.warn(`Could not get stats for ${sourceFilePath}: ${error.message}`);
             // Optionally skip this file or handle error differently
        }
      }
    }
    console.log(`Found ${mp3Files.length} MP3 files in source directory.`);

    // Sort by modification time (newest first)
    mp3Files.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Get the latest N demos
    const latestDemos = mp3Files.slice(0, maxDemos);
    console.log(`Selected the latest ${latestDemos.length} demos.`);

    // --- Cleanup and Copy ---
    // Get list of existing files in target directory (for cleanup)
    let existingTargetFiles: string[] = [];
     try {
        existingTargetFiles = await fs.readdir(targetDir);
     } catch (err) {
        // Ignore if target dir doesn't exist yet (it should, but safety first)
        const error = err as NodeJS.ErrnoException;
        if (error.code !== 'ENOENT') {
            console.warn(`Could not read target directory ${targetDir} for cleanup: ${error.message}`);
        }
     }

    const latestDemoNames = new Set(latestDemos.map(demo => demo.name));
    const filesToDelete = [];

    // Find files in target dir that are *not* in the latest list
    for (const existingFile of existingTargetFiles) {
        if (!latestDemoNames.has(existingFile) && path.extname(existingFile).toLowerCase() === '.mp3') {
            filesToDelete.push(path.join(targetDir, existingFile));
        }
    }

    // Delete old files
    if (filesToDelete.length > 0) {
        console.log(`Deleting ${filesToDelete.length} old demos from target directory...`);
        await Promise.all(filesToDelete.map(file => fs.unlink(file).catch(err => {
             const error = err as Error;
             console.warn(`Failed to delete ${file}: ${error.message}`)
        })));
    } else {
        console.log("No old demos to delete from target directory.");
    }

    // Copy latest N demos to target directory
    const demoDataForJson = [];
    console.log(`Copying ${latestDemos.length} demos to ${targetDir}...`);
    for (const demo of latestDemos) {
      const targetFilePath = path.join(targetDir, demo.name);
      try {
        await fs.copyFile(demo.sourcePath, targetFilePath);
        demoDataForJson.push({
          fileName: demo.name,
          relativePath: `/audio/demos/${demo.name}`, // Path for web access
          timestamp: demo.mtime.toISOString(), // Store timestamp
        });
      } catch (copyErr) {
          const error = copyErr as Error;
          console.error(`Error copying ${demo.name} to ${targetDir}: ${error.message}`);
          // Decide if you want to skip this file or stop the process
      }
    }

    // --- Generate JSON ---
    console.log(`Writing demo data to ${jsonOutputFile}`);
    await fs.writeFile(jsonOutputFile, JSON.stringify(demoDataForJson, null, 2));

    console.log('Demo sync completed successfully!');

  } catch (error) {
     const err = error as Error;
    console.error('Error during demo sync process:', err);
    process.exit(1); // Exit with error code
  }
}

syncDemos(); 