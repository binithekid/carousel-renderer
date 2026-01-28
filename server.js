const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ready',
    message: 'Carousel renderer is running',
    version: '1.0.0'
  });
});

// Main rendering endpoint
app.post('/render', async (req, res) => {
  const { html } = req.body;
  
  if (!html) {
    return res.status(400).json({ 
      error: 'HTML content required',
      usage: 'POST /render with {"html": "<html>...</html>"}'
    });
  }
  
  console.log('Rendering carousel slide...');
  let browser;
  
  try {
    // Launch headless Chrome
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport to Instagram carousel dimensions (1080x1350, 4:5 ratio)
    // deviceScaleFactor: 2 gives retina quality
    await page.setViewport({ 
      width: 1080, 
      height: 1350, 
      deviceScaleFactor: 2
    });
    
    // Load the HTML
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Render to PNG (base64 encoded)
    const screenshot = await page.screenshot({ 
      type: 'png',
      encoding: 'base64'
    });
    
    await browser.close();
    
    console.log('✅ Render complete');
    
    // Return the image as base64
    res.json({ 
      success: true,
      image: screenshot,
      width: 1080,
      height: 1350,
      format: 'png'
    });
    
  } catch (error) {
    console.error('❌ Render error:', error.message);
    
    if (browser) {
      await browser.close();
    }
    
    res.status(500).json({ 
      error: 'Rendering failed',
      message: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Carousel renderer running on port ${PORT}`);
});
