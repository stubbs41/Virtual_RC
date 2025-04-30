const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to run a command and log the output
function runCommand(command) {
  console.log(`Running command: ${command}`);
  try {
    const output = execSync(command, { stdio: 'inherit' });
    return output;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return null;
  }
}

// Function to check if a file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Function to modify a file
function modifyFile(filePath, searchValue, replaceValue) {
  if (!fileExists(filePath)) {
    console.error(`File not found: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(searchValue, replaceValue);
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`Modified file: ${filePath}`);
  return true;
}

// Main deployment function
async function deploy() {
  console.log('Starting deployment process...');

  // 1. Install dependencies
  console.log('Installing dependencies...');
  runCommand('npm install');

  // 2. Modify next.config.js for static export
  console.log('Configuring for static export...');
  modifyFile(
    path.join(__dirname, 'next.config.js'),
    '// output: \'export\',',
    'output: \'export\','
  );

  // 3. Build the application
  console.log('Building the application...');
  runCommand('npm run build');

  // 4. Run the build fix script
  console.log('Running build fix script...');
  require('./build-fix');

  // 5. Check if the build was successful
  if (fileExists(path.join(__dirname, 'out'))) {
    console.log('Static export successful! Files are in the "out" directory.');
    console.log('You can now deploy these files to any static hosting service.');
  } else {
    console.log('Static export failed. Trying server-side rendering build...');
    
    // 6. Modify next.config.js for server-side rendering
    modifyFile(
      path.join(__dirname, 'next.config.js'),
      'output: \'export\',',
      '// output: \'export\','
    );
    
    modifyFile(
      path.join(__dirname, 'next.config.js'),
      '// output: \'standalone\',',
      'output: \'standalone\','
    );
    
    // 7. Build again for server-side rendering
    console.log('Building for server-side rendering...');
    runCommand('npm run build');
    
    // 8. Run the build fix script again
    console.log('Running build fix script again...');
    require('./build-fix');
    
    if (fileExists(path.join(__dirname, '.next', 'standalone'))) {
      console.log('Server-side rendering build successful!');
      console.log('You can now deploy the ".next" directory to a Node.js hosting service.');
    } else {
      console.error('Both build methods failed. Please check the logs for errors.');
      process.exit(1);
    }
  }

  console.log('Deployment process completed successfully.');
}

// Run the deployment
deploy().catch(error => {
  console.error('Error during deployment:', error);
  process.exit(1);
});
