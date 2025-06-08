#!/usr/bin/env node

/**
 * Moodify Setup Verification Script
 * Checks if all components are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🎵 Moodify Setup Verification\n');

// Check if required files exist
const requiredFiles = [
  'package.json',
  'src/index.js',
  'routes/auth.js',
  'routes/music.js',
  'config/spotify.js',
  'config/moodMapper.js',
  'public/index.html',
  'public/app.js',
  '.env.example',
  '.gitignore',
  'README.md'
];

console.log('📁 Checking file structure...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check package.json dependencies
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['express', 'dotenv', 'express-session', 'axios', 'querystring'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} - ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json');
  allFilesExist = false;
}

// Check .env.example
console.log('\n🔐 Checking environment template...');
try {
  const envExample = fs.readFileSync('.env.example', 'utf8');
  const requiredVars = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET', 'REDIRECT_URI', 'SESSION_SECRET'];
  
  requiredVars.forEach(varName => {
    if (envExample.includes(varName)) {
      console.log(`✅ ${varName}`);
    } else {
      console.log(`❌ ${varName} - MISSING`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading .env.example');
  allFilesExist = false;
}

// Check .gitignore
console.log('\n🚫 Checking .gitignore...');
try {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  const requiredIgnores = ['.env', 'node_modules'];
  
  requiredIgnores.forEach(ignore => {
    if (gitignore.includes(ignore)) {
      console.log(`✅ ${ignore} ignored`);
    } else {
      console.log(`❌ ${ignore} - NOT IGNORED`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Error reading .gitignore');
  allFilesExist = false;
}

// Test mood mapper
console.log('\n🎭 Testing mood mapper...');
try {
  const { getMoodFeatures, getSupportedMoods } = require('./config/moodMapper');
  const moods = getSupportedMoods();
  console.log(`✅ ${moods.length} moods supported: ${moods.join(', ')}`);
  
  // Test one mood
  const happyFeatures = getMoodFeatures('happy');
  console.log(`✅ Happy mood features: valence=${happyFeatures.target_valence}, energy=${happyFeatures.target_energy}`);
} catch (error) {
  console.log(`❌ Mood mapper error: ${error.message}`);
  allFilesExist = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('🎉 All checks passed! Moodify is ready to run.');
  console.log('\nNext steps:');
  console.log('1. Copy .env.example to .env');
  console.log('2. Add your Spotify app credentials to .env');
  console.log('3. Run: npm start');
  console.log('4. Visit: http://localhost:3000');
} else {
  console.log('❌ Some checks failed. Please review the issues above.');
}
console.log('='.repeat(50));
