const fs = require('fs');
const path = require('path');

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

// Check if the problematic directory exists and delete it
const mainFolderPath = path.join(__dirname, '.next', 'server', 'app', '(main)');
if (fs.existsSync(mainFolderPath)) {
  console.log('Found problematic (main) folder, removing it...');
  deleteFolderRecursive(mainFolderPath);
} else {
  console.log('No problematic (main) folder found.');
}

console.log('Build fix script completed successfully.');
