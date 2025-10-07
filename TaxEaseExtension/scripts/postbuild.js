import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const filesToCopy = [
  'manifest.json',
  'mock-page.html'
];

const sourceDir = resolve(process.cwd());
const distDir = resolve(process.cwd(), 'dist');

// Create dist directory if it doesn't exist
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Copy files to dist directory
filesToCopy.forEach(file => {
  const sourcePath = resolve(sourceDir, file);
  const destPath = resolve(distDir, file);
  
  if (existsSync(sourcePath)) {
    copyFileSync(sourcePath, destPath);
    console.log(`Copied ${file} to dist folder`);
  } else {
    console.log(`Warning: ${file} not found, skipping...`);
  }
});

// Copy icon separately
const iconSource = resolve(sourceDir, 'public', 'icon.svg');
const iconDest = resolve(distDir, 'icon.svg');

if (existsSync(iconSource)) {
  copyFileSync(iconSource, iconDest);
  console.log('Copied icon.svg to dist folder');
} else {
  console.log('Warning: icon.svg not found, skipping...');
}

console.log('Post-build process completed!');