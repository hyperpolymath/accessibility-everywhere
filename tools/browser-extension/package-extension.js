#!/usr/bin/env node

/**
 * Package browser extension into a .zip file for distribution
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const distDir = path.join(__dirname, 'dist');
const zipFile = path.join(distDir, 'accessibility-everywhere-extension.zip');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Remove old zip if it exists
if (fs.existsSync(zipFile)) {
  fs.unlinkSync(zipFile);
}

// Files to include in the extension package
const filesToPackage = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'popup.css',
  'content.js',
  'background.js',
  'axe.min.js',
  'icons/icon-16.png',
  'icons/icon-32.png',
  'icons/icon-48.png',
  'icons/icon-128.png',
];

// Verify all required files exist
console.log('Checking required files...');
let missingFiles = [];
for (const file of filesToPackage) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.warn('⚠️  Warning: Some files are missing (skipping):');
  missingFiles.forEach(file => console.warn(`  - ${file}`));
}

// Create zip archive
console.log('Packaging extension...');

try {
  // Use zip command if available, otherwise use Node.js archiver
  const files = filesToPackage.filter(f => !missingFiles.includes(f)).join(' ');
  execSync(`zip -r "${zipFile}" ${files}`, {
    cwd: __dirname,
    stdio: 'inherit'
  });

  console.log('✅ Extension packaged successfully!');
  console.log(`📦 Output: ${zipFile}`);

  const stats = fs.statSync(zipFile);
  console.log(`📊 Size: ${(stats.size / 1024).toFixed(2)} KB`);
} catch (error) {
  if (error.message.includes('zip')) {
    console.log('⚠️  zip command not found, using fallback method...');

    // Fallback: use Node.js archiver package if zip command is not available
    try {
      const archiver = require('archiver');
      const output = fs.createWriteStream(zipFile);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        console.log('✅ Extension packaged successfully!');
        console.log(`📦 Output: ${zipFile}`);
        console.log(`📊 Size: ${(archive.pointer() / 1024).toFixed(2)} KB`);
      });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(output);

      // Add files to archive
      filesToPackage.filter(f => !missingFiles.includes(f)).forEach(file => {
        const filePath = path.join(__dirname, file);
        archive.file(filePath, { name: file });
      });

      archive.finalize();
    } catch (archiverError) {
      console.error('❌ Error: archiver package not found.');
      console.error('Please install archiver: npm install archiver --save-dev');
      console.error('Or install zip command: sudo apt-get install zip (Linux) or brew install zip (macOS)');
      process.exit(1);
    }
  } else {
    throw error;
  }
}
