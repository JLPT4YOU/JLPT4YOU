// Test script to inspect Kanji HTML structure
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { JSDOM } = require('jsdom');

async function testKanjiParsing() {
  const query = '日本';
  const url = `https://api.tracau.vn/WBBcwnwQpV89/dj/${encodeURIComponent(query)}`;
  
  console.log('Fetching data for:', query);
  
  try {
    const res = await fetch(url);
    const json = await res.json();
    const fulltext = json?.tratu?.[0]?.fields?.fulltext;
    
    if (!fulltext) {
      console.log('No fulltext found');
      return;
    }
    
    // Parse HTML
    const dom = new JSDOM(fulltext);
    const doc = dom.window.document;
    
    // Find Kanji section
    const kanjiArticle = doc.querySelector('article#dict_kj');
    if (!kanjiArticle) {
      console.log('No Kanji section found');
      return;
    }
    
    console.log('\n=== KANJI SECTION STRUCTURE ===');
    
    // Look for individual Kanji blocks
    const kanjiBlocks = kanjiArticle.querySelectorAll('.card, .kanji-block, .kanji-item, [data-kanji]');
    console.log('Found kanji blocks:', kanjiBlocks.length);
    
    // Check for tables with Kanji info
    const tables = kanjiArticle.querySelectorAll('table');
    console.log('Found tables:', tables.length);
    
    // Check for divs with specific patterns
    const divs = kanjiArticle.querySelectorAll('div[id], div[class*="kanji"]');
    console.log('Found kanji divs:', divs.length);
    
    // Extract script tags for SVGs
    const scripts = doc.querySelectorAll('script');
    const svgData = [];
    scripts.forEach(script => {
      const text = script.textContent || '';
      const textMatch = text.match(/var\s+text\d+\s*=\s*'([^']+)'/);
      const svgMatch = text.match(/var\s+svg\d+\s*=\s*'([\s\S]*?)';/);
      if (textMatch && svgMatch) {
        svgData.push({ char: textMatch[1], hasVg: true });
      }
    });
    console.log('\nSVG data found for characters:', svgData);
    
    // Print first part of Kanji HTML to understand structure
    console.log('\n=== FIRST 2000 CHARS OF KANJI HTML ===');
    console.log(kanjiArticle.innerHTML.substring(0, 2000));
    
    // Look for specific patterns that might separate individual Kanji
    const h3s = kanjiArticle.querySelectorAll('h3, h4, h5');
    console.log('\n=== HEADERS IN KANJI SECTION ===');
    h3s.forEach(h => {
      console.log(`${h.tagName}: ${h.textContent.trim()}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testKanjiParsing();
