const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to recursively delete a directory
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call for directories
        deleteFolderRecursive(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
    console.log(`Deleted folder: ${folderPath}`);
  }
}

// Function to check if a file exists and create a backup
function backupFile(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`Created backup of ${filePath} at ${backupPath}`);
    return true;
  }
  return false;
}

// Function to restore a file from backup
function restoreFile(filePath) {
  const backupPath = `${filePath}.backup`;
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, filePath);
    fs.unlinkSync(backupPath);
    console.log(`Restored ${filePath} from backup`);
    return true;
  }
  return false;
}

// Main function to fix the build
async function fixBuild() {
  console.log('Starting build fix process...');

  // 1. Check if the problematic directory exists and delete it
  const mainFolderPath = path.join(__dirname, '.next', 'server', 'app', '(main)');
  if (fs.existsSync(mainFolderPath)) {
    console.log('Found problematic (main) folder, removing it...');
    deleteFolderRecursive(mainFolderPath);
  } else {
    console.log('No problematic (main) folder found.');
  }

  // 2. Check if the standalone directory exists and fix it
  const standalonePath = path.join(__dirname, '.next', 'standalone');
  if (fs.existsSync(standalonePath)) {
    console.log('Found standalone directory, checking for issues...');

    // Check for the problematic directory in standalone
    const standaloneMainPath = path.join(standalonePath, '.next', 'server', 'app', '(main)');
    if (fs.existsSync(standaloneMainPath)) {
      console.log('Found problematic (main) folder in standalone, removing it...');
      deleteFolderRecursive(standaloneMainPath);
    }
  }

  // 3. Create necessary directories if they don't exist
  const requiredDirs = [
    path.join(__dirname, '.next', 'server', 'pages'),
    path.join(__dirname, '.next', 'static')
  ];

  requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });

  console.log('Build fix process completed successfully.');
}

// Run the fix
fixBuild().catch(error => {
  console.error('Error during build fix:', error);
  process.exit(1);
});
