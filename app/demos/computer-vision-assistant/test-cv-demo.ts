import fs from 'fs';
import path from 'path';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_IMAGE_PATH = '/mnt/c/Users/DanielRomitelli/Desktop/Builds/portfolio/public/placeholder.jpg';

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Test utilities
function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function loadTestImage(): Promise<string> {
  try {
    const imagePath = fs.existsSync(TEST_IMAGE_PATH) 
      ? TEST_IMAGE_PATH 
      : path.join(process.cwd(), 'public', 'placeholder.jpg');
    
    const imageBuffer = fs.readFileSync(imagePath);
    return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    log(`Error loading test image: ${error}`, 'red');
    // Return a small test image if file not found
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }
}

// API Tests
async function testCaptionAPI() {
  log('\n🎯 Testing Caption API...', 'blue');
  
  try {
    const image = await loadTestImage();
    
    // Test non-streaming
    const response1 = await fetch(`${BASE_URL}/api/caption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, stream: false })
    });
    
    if (!response1.ok) {
      throw new Error(`HTTP ${response1.status}: ${await response1.text()}`);
    }
    
    const data1 = await response1.json();
    log(`✓ Non-streaming caption: ${data1.caption}`, 'green');
    
    // Test streaming
    const response2 = await fetch(`${BASE_URL}/api/caption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, stream: true, temperature: 0.7 })
    });
    
    if (!response2.ok) {
      throw new Error(`HTTP ${response2.status}: ${await response2.text()}`);
    }
    
    const reader = response2.body?.getReader();
    const decoder = new TextDecoder();
    let caption = '';
    
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      caption += decoder.decode(value);
    }
    
    log(`✓ Streaming caption received (${caption.length} chars)`, 'green');
    
  } catch (error) {
    log(`✗ Caption API Error: ${error}`, 'red');
  }
}

async function testDetectAPI() {
  log('\n🎯 Testing Detect API...', 'blue');
  
  try {
    const image = await loadTestImage();
    
    const response = await fetch(`${BASE_URL}/api/detect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image,
        query: 'detect all objects',
        threshold: 0.3
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    log(`✓ Detected ${data.detections.length} objects`, 'green');
    
    data.detections.forEach((det: any, i: number) => {
      log(`  ${i + 1}. ${det.label} (${(det.score * 100).toFixed(1)}%)`, 'green');
    });
    
  } catch (error) {
    log(`✗ Detect API Error: ${error}`, 'red');
  }
}

async function testSegmentAPI() {
  log('\n🎯 Testing Segment API...', 'blue');
  
  try {
    const image = await loadTestImage();
    
    // Test different modes
    const modes = ['sam2.1', 'hq', 'fast'];
    
    for (const mode of modes) {
      const response = await fetch(`${BASE_URL}/api/segment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, mode })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      log(`✓ Segmentation mode '${mode}': ${data.masks.length} masks`, 'green');
    }
    
  } catch (error) {
    log(`✗ Segment API Error: ${error}`, 'red');
  }
}

async function testChatAPI() {
  log('\n🎯 Testing Chat API...', 'blue');
  
  try {
    const image = await loadTestImage();
    
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'What do you see in this image?' }
        ],
        image
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let message = '';
    
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      message += decoder.decode(value);
    }
    
    log(`✓ Chat response received (${message.length} chars)`, 'green');
    
  } catch (error) {
    log(`✗ Chat API Error: ${error}`, 'red');
  }
}

async function testInpaintAPI() {
  log('\n🎯 Testing Inpaint API...', 'blue');
  
  try {
    const image = await loadTestImage();
    
    // Create a simple mask (black with white circle in center)
    const maskCanvas = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAHElEQVQYV2NkYPhfz0AEYBxVSF+Fg4oLHxgYGABIkAQKZ/LccQAAAABJRU5ErkJggg==`;
    
    const response = await fetch(`${BASE_URL}/api/inpaint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image,
        mask: maskCanvas,
        prompt: 'a beautiful flower'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    log(`✓ Inpainted image received (${data.image.length} chars)`, 'green');
    
  } catch (error) {
    log(`✗ Inpaint API Error: ${error}`, 'red');
  }
}

// Component Tests
async function testUIComponents() {
  log('\n🎯 Testing UI Components...', 'blue');
  
  try {
    // Test page loads
    const response = await fetch(`${BASE_URL}/demos/computer-vision-assistant`);
    if (!response.ok) {
      throw new Error(`Page load failed: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Check for key components
    const components = [
      'CV Demo v4',
      'Hugging Face Pro',
      'Caption',
      'Detect', 
      'Segment',
      'Chat',
      'Inpaint'
    ];
    
    components.forEach(component => {
      if (html.includes(component)) {
        log(`✓ Component found: ${component}`, 'green');
      } else {
        log(`✗ Component missing: ${component}`, 'red');
      }
    });
    
  } catch (error) {
    log(`✗ UI Component Error: ${error}`, 'red');
  }
}

// Environment Tests
async function testEnvironment() {
  log('\n🎯 Testing Environment Configuration...', 'blue');
  
  const requiredEnvVars = [
    'HUGGING_FACE_API_KEY'
  ];
  
  const optionalEnvVars = [
    'HF_ENDPOINT_CAPTION',
    'HF_ENDPOINT_DETECT',
    'HF_ENDPOINT_SEGMENT',
    'HF_ENDPOINT_CHAT',
    'HF_ENDPOINT_INPAINT'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      log(`✓ ${envVar} is set`, 'green');
    } else {
      log(`✗ ${envVar} is missing (required)`, 'red');
    }
  });
  
  optionalEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      log(`✓ ${envVar} is set (custom endpoint)`, 'green');
    } else {
      log(`- ${envVar} not set (using default)`, 'yellow');
    }
  });
}

// Main test runner
async function runAllTests() {
  log('\n🚀 CV Demo v4 Test Suite', 'blue');
  log('================================', 'blue');
  
  // Check environment first
  await testEnvironment();
  
  // Test APIs
  await testCaptionAPI();
  await testDetectAPI();
  await testSegmentAPI();
  await testChatAPI();
  await testInpaintAPI();
  
  // Test UI
  await testUIComponents();
  
  log('\n✅ Test suite completed!', 'green');
  log('================================', 'blue');
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite failed: ${error}`, 'red');
  process.exit(1);
});