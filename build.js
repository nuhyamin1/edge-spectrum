const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function execCommand(command, cwd = process.cwd()) {
  try {
    console.log(`${colors.yellow}Executing: ${command}${colors.reset}`);
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${colors.red}Error executing ${command}:${colors.reset}`, error);
    return false;
  }
}

function buildProject() {
  console.log(`${colors.bright}Starting production build process...${colors.reset}\n`);

  // Install backend dependencies
  console.log(`${colors.bright}Installing backend dependencies...${colors.reset}`);
  if (!execCommand('npm install')) return false;

  // Install frontend dependencies
  console.log(`\n${colors.bright}Installing frontend dependencies...${colors.reset}`);
  if (!execCommand('npm install', path.join(process.cwd(), 'client'))) return false;

  // Build frontend
  console.log(`\n${colors.bright}Building frontend...${colors.reset}`);
  if (!execCommand('npm run build', path.join(process.cwd(), 'client'))) return false;

  // Create production environment file if it doesn't exist
  try {
    require('fs').copyFileSync('.env.example', '.env.production');
    console.log(`${colors.green}Created .env.production file${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}Note: .env.production already exists${colors.reset}`);
  }

  console.log(`\n${colors.green}${colors.bright}Build completed successfully!${colors.reset}\n`);
  console.log('Next steps:');
  console.log('1. Update environment variables in .env.production');
  console.log('2. Test the build locally:');
  console.log('   - Backend: NODE_ENV=production node server/server.js');
  console.log('   - Frontend: serve -s client/build');
  console.log('3. Deploy to your hosting provider');
  
  return true;
}

buildProject();
