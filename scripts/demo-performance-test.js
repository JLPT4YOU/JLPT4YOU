#!/usr/bin/env node

/**
 * Demo Performance Test Script
 * Chạy demo đánh giá performance cho JLPT4YOU
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 JLPT4YOU Performance Testing Demo');
console.log('=====================================\n');

// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => resolve(false));
    req.end();
  });
}

// Start development server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Starting development server...');
    
    const server = spawn('npm', ['run', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    let output = '';
    
    server.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('ready on') || output.includes('Local:')) {
        console.log('✅ Development server started');
        resolve(server);
      }
    });

    server.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      reject(new Error('Server start timeout'));
    }, 30000);
  });
}

// Run performance tests
async function runPerformanceTests() {
  console.log('\n📊 Running performance tests...');
  
  const tests = [
    {
      name: 'Basic Lighthouse Test',
      command: 'npm',
      args: ['run', 'lighthouse'],
      description: 'Chạy Lighthouse test cơ bản'
    },
    {
      name: 'Custom URL Test',
      command: 'node',
      args: ['scripts/lighthouse-performance-test.js', 'http://localhost:3000/home'],
      description: 'Test trang Home cụ thể'
    }
  ];

  for (const test of tests) {
    console.log(`\n🔍 ${test.name}`);
    console.log(`   ${test.description}`);
    
    try {
      await runCommand(test.command, test.args);
      console.log(`✅ ${test.name} completed`);
    } catch (error) {
      console.log(`❌ ${test.name} failed:`, error.message);
    }
  }
}

// Run a command and return promise
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
      // Show real-time output for important messages
      const line = data.toString().trim();
      if (line.includes('Testing:') || line.includes('Completed:') || line.includes('PASSED') || line.includes('FAILED')) {
        console.log(`   ${line}`);
      }
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
      }
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      process.kill();
      reject(new Error('Command timeout'));
    }, 120000);
  });
}

// Show results
function showResults() {
  console.log('\n📋 Checking results...');
  
  const reportsDir = path.join(__dirname, '../lighthouse-reports');
  
  if (fs.existsSync(reportsDir)) {
    const files = fs.readdirSync(reportsDir);
    const recentFiles = files
      .filter(f => f.includes(new Date().toISOString().split('T')[0]))
      .sort()
      .reverse();
    
    if (recentFiles.length > 0) {
      console.log('✅ Reports generated:');
      recentFiles.forEach(file => {
        console.log(`   📄 ${file}`);
      });
      
      // Show summary from latest JSON report
      const jsonFiles = recentFiles.filter(f => f.endsWith('.json'));
      if (jsonFiles.length > 0) {
        try {
          const reportPath = path.join(reportsDir, jsonFiles[0]);
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
          
          console.log('\n📊 Performance Summary:');
          if (Array.isArray(report)) {
            report.forEach((result, index) => {
              console.log(`   ${index + 1}. ${result.url}`);
              console.log(`      Performance: ${result.scores?.performance || 'N/A'}/100`);
              console.log(`      Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
            });
          }
        } catch (error) {
          console.log('   ⚠️ Could not parse report summary');
        }
      }
    } else {
      console.log('⚠️ No reports found for today');
    }
  } else {
    console.log('⚠️ Reports directory not found');
  }
}

// Show dashboard info
function showDashboardInfo() {
  console.log('\n🎛️ Performance Dashboard');
  console.log('========================');
  console.log('Access the performance dashboard at:');
  console.log('👉 http://localhost:3000/admin/performance');
  console.log('');
  console.log('Available tabs:');
  console.log('• Dashboard - Real-time Core Web Vitals');
  console.log('• Testing - Manual performance tests');
  console.log('• Interactions - User interaction tracking');
  console.log('• Reports - Generate detailed reports');
  console.log('');
  console.log('💡 Tip: Keep the dashboard open while browsing to see real-time metrics');
}

// Main demo function
async function runDemo() {
  try {
    // Check if server is already running
    const serverRunning = await checkServer();
    let server = null;
    
    if (!serverRunning) {
      server = await startServer();
      // Wait a bit for server to fully start
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log('✅ Development server already running');
    }

    // Show dashboard info
    showDashboardInfo();

    // Ask user if they want to run tests
    console.log('\n❓ Do you want to run performance tests now?');
    console.log('   This will take a few minutes...');
    console.log('   Press Ctrl+C to skip, or wait 10 seconds to continue');

    await new Promise(resolve => {
      const timeout = setTimeout(resolve, 10000);
      
      process.on('SIGINT', () => {
        clearTimeout(timeout);
        console.log('\n⏭️ Skipping performance tests');
        console.log('You can run them manually with: npm run lighthouse');
        resolve();
      });
    });

    // Run performance tests
    await runPerformanceTests();

    // Show results
    showResults();

    console.log('\n🎉 Demo completed!');
    console.log('================');
    console.log('Next steps:');
    console.log('1. Visit http://localhost:3000/admin/performance');
    console.log('2. Browse the website to generate interaction data');
    console.log('3. Generate reports in the Reports tab');
    console.log('4. Run "npm run lighthouse" for additional tests');

    // Keep server running if we started it
    if (server) {
      console.log('\n🔄 Development server is still running...');
      console.log('Press Ctrl+C to stop');
      
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping development server...');
        server.kill();
        process.exit(0);
      });
    }

  } catch (error) {
    console.error('\n💥 Demo failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you have Chrome installed');
    console.log('2. Check if port 3000 is available');
    console.log('3. Run "npm install" to ensure dependencies');
    console.log('4. Try running "npm run dev" manually first');
    process.exit(1);
  }
}

// Handle CLI
if (require.main === module) {
  console.log('Starting in 3 seconds... (Press Ctrl+C to cancel)');
  
  setTimeout(() => {
    runDemo().catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  }, 3000);
  
  // Allow immediate start with --now flag
  if (process.argv.includes('--now')) {
    runDemo().catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  }
}
