import { promises as fs } from 'fs';
import path from 'path';

// --- Configuration ---
// Define multiple source directories
const sourceDirs = [
    '/Users/yeneirvine/Dropbox/TWIST/yen exports post frequency',
    '/Users/yeneirvine/Dropbox/TWIST/yenzy sexports alpha',
    "/Users/yeneirvine/Dropbox/TWIST/yenzy's sexports" // Ensure path quoting/escaping is correct if needed by shell later
];
const targetDir = path.join(__dirname, '../../public/audio/demos');
const jsonOutputFile = path.join(__dirname, '../../public/demos.json');
const maxDemos = 50;
// --- End Configuration ---

async function syncDemos() {
  console.log(`Starting demo sync from ${sourceDirs.length} source directorie(s)...`);

  try {
    // Ensure target directory exists
    await fs.mkdir(targetDir, { recursive: true });
    console.log(`Ensured target directory exists: ${targetDir}`);

    // Filter for MP3 files and get stats
    const mp3Files: { name: string; mtime: Date; sourcePath: string }[] = [];

   // Loop through each source directory
   for (const sourceDir of sourceDirs) {
       console.log(`Processing source directory: ${sourceDir}`);
       let currentDirFiles;
       try {
           currentDirFiles = await fs.readdir(sourceDir);
       } catch (err) {
           const error = err as Error;
           console.error(`Error reading source directory ${sourceDir}: ${error.message}`);
           console.error("Skipping this directory. Please ensure the path is correct and you have permissions.");
           continue; // Skip to the next directory on error
       }

       for (const file of currentDirFiles) {
          if (path.extname(file).toLowerCase() === '.mp3') {
            const sourceFilePath = path.join(sourceDir, file); // Use current sourceDir
            try {
                const stats = await fs.stat(sourceFilePath);
                if (stats.isFile()) {
                    if (stats.size === 0) {
                        console.warn(`Skipping 0-byte file: ${file} in ${sourceDir}`);
                        continue;
                    }
                    mp3Files.push({ // Add to the single combined list
                        name: file,
                        mtime: stats.mtime,
                        sourcePath: sourceFilePath, // Store the full path from its original source
                    });
                }
            } catch (statErr) {
                 const error = statErr as Error;
                 console.warn(`Could not get stats for ${sourceFilePath}: ${error.message}`);
            }
          }
       } // End loop for files in current directory
   } // End loop for source directories

   console.log(`Found ${mp3Files.length} total non-empty MP3 files across all source directories.`);

    // Sort by modification time (newest first) - applied to combined list
    mp3Files.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Get the latest N demos overall
    const latestDemos = mp3Files.slice(0, maxDemos);
    console.log(`Selected the latest ${latestDemos.length} demos overall to sync (up to ${maxDemos}).`);

    // --- Cleanup and Copy ---
    let existingTargetFiles: string[] = [];
     try {
        existingTargetFiles = await fs.readdir(targetDir);
     } catch (err) {
        const error = err as NodeJS.ErrnoException;
        if (error.code !== 'ENOENT') {
            console.warn(`Could not read target directory ${targetDir} for cleanup: ${error.message}`);
        }
     }

    const latestDemoNames = new Set(latestDemos.map(demo => demo.name));
    const filesToDelete = [];

    for (const existingFile of existingTargetFiles) {
        if (path.extname(existingFile).toLowerCase() === '.mp3' && !latestDemoNames.has(existingFile)) {
            filesToDelete.push(path.join(targetDir, existingFile));
        }
    }

    if (filesToDelete.length > 0) {
        console.log(`Deleting ${filesToDelete.length} old or now-empty demos from target directory...`);
        await Promise.all(filesToDelete.map(file => fs.unlink(file).catch(err => {
             const error = err as Error;
             console.warn(`Failed to delete ${file}: ${error.message}`)
        })));
    } else {
        console.log("No old or now-empty demos to delete from target directory.");
    }

    // Copy logic remains the same - copies from the combined 'latestDemos' list
    // (sourcePath already contains the full original path)
     const demoDataForJson = [];
     console.log(`Copying ${latestDemos.length} demos to ${targetDir}...`);
     for (const demo of latestDemos) {
       const targetFilePath = path.join(targetDir, demo.name);
       try {
         await fs.copyFile(demo.sourcePath, targetFilePath);
         demoDataForJson.push({
           fileName: demo.name,
           relativePath: `/audio/demos/${demo.name}`,
           timestamp: demo.mtime.toISOString(),
         });
       } catch (copyErr) {
           const error = copyErr as Error;
           console.error(`Error copying ${demo.name} (from ${demo.sourcePath}) to ${targetDir}: ${error.message}`);
       }
     }


    console.log(`Writing demo data for ${demoDataForJson.length} files to ${jsonOutputFile}`);
    await fs.writeFile(jsonOutputFile, JSON.stringify(demoDataForJson, null, 2));

    console.log('Demo sync completed successfully!');

  } catch (error) {
     const err = error as Error;
    console.error('Error during demo sync process:', err);
    process.exit(1);
  }
}

syncDemos(); 