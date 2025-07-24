const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');
const readline = require('readline');

function extractFilename(lines) {
  let filename = '';
  let contentStartIdx = 0;
  
  if (lines.length === 0) return { filename: '', contentStartIdx: 0 };
  
  const firstLine = lines[0].trim();
  
  if (firstLine.startsWith('//')) {
    // JavaScript, TypeScript, CSS, etc.
    filename = firstLine.substring(2).trim();
    contentStartIdx = 1;
  } else if (firstLine.startsWith('#!')) {
    // Shell script with shebang
    if (lines.length > 1 && lines[1].trim().startsWith('#')) {
      filename = lines[1].substring(1).trim();
      contentStartIdx = 2;
    } else {
      console.error('Expected comment with filename on line 2 after shebang');
      return { filename: '', contentStartIdx: 0 };
    }
  } else if (firstLine.startsWith('#')) {
    // Python, Ruby, shell scripts without shebang, etc.
    filename = firstLine.substring(1).trim();
    contentStartIdx = 1;
  } else {
    // No comment-based filename found (JSON, XML, etc.)
    console.log('No comment-based filename found. Will prompt for filename.');
    return { filename: '', contentStartIdx: 0 };
  }
  
  return { filename, contentStartIdx };
}

async function promptFilename() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Enter filename: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  try {
    // Get clipboard content based on platform
    let clipCmd;
    const platform = os.platform();
    
    if (platform === 'darwin') {
      clipCmd = 'pbpaste';
    } else if (platform === 'linux') {
      clipCmd = 'xclip -selection clipboard -o';
    } else if (platform === 'win32') {
      clipCmd = 'powershell -command "Get-Clipboard"';
    } else {
      throw new Error('Unsupported platform: ' + platform);
    }
    
    const clip = execSync(clipCmd, { 
      encoding: 'utf8', 
      stdio: ['pipe', 'pipe', 'ignore'] 
    });
    
    const lines = clip.split(platform === 'win32' ? '\r\n' : '\n');
    
    if (lines.length === 0) {
      console.error('Clipboard is empty');
      process.exit(1);
    }
    
    // Extract filename from clipboard content
    const { filename: extractedFilename, contentStartIdx } = extractFilename(lines);
    
    let filename = extractedFilename;
    if (!filename) {
      filename = await promptFilename();
      if (!filename) {
        console.error('No filename provided');
        process.exit(1);
      }
    }
    
    // Get content (everything after the filename line(s))
    const content = lines.slice(contentStartIdx).join(platform === 'win32' ? '\r\n' : '\n');
    
    // Create directory if needed
    const dir = path.dirname(filename);
    if (dir !== '.' && dir !== '') {
      fs.mkdirSync(dir, { recursive: true });
      console.log('Created directory:', dir);
    }
    
    // Write file
    fs.writeFileSync(filename, content);
    console.log('✅ Created file:', filename);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
