// Detailed test to understand Kanji tab structure
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { JSDOM } = require('jsdom');

async function testKanjiStructure() {
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
    
    console.log('\n=== TAB STRUCTURE ===');
    
    // Find tab navigation
    const tabNav = kanjiArticle.querySelector('.simpleTabs .stn');
    if (tabNav) {
      const tabs = tabNav.querySelectorAll('li a');
      console.log('Tab buttons found:', tabs.length);
      tabs.forEach((tab, i) => {
        console.log(`Tab ${i}: "${tab.textContent}"`);
      });
    }
    
    // Find tab content containers
    const tabContents = kanjiArticle.querySelectorAll('.simpleTabs .stc > div');
    console.log('\nTab content divs found:', tabContents.length);
    
    // Check if each tab content has dc class
    const dcDivs = kanjiArticle.querySelectorAll('.simpleTabs .stc .dc');
    console.log('DC divs (tab panels) found:', dcDivs.length);
    
    // Look at the structure more carefully
    console.log('\n=== DETAILED STRUCTURE ===');
    const simpleTabs = kanjiArticle.querySelector('.simpleTabs');
    if (simpleTabs) {
      // Get immediate children of .stc
      const stc = simpleTabs.querySelector('.stc');
      if (stc) {
        const children = stc.children;
        console.log('Direct children of .stc:', children.length);
        
        for (let i = 0; i < Math.min(2, children.length); i++) {
          console.log(`\nChild ${i}:`);
          console.log('- Tag:', children[i].tagName);
          console.log('- Class:', children[i].className);
          console.log('- ID:', children[i].id || 'none');
          console.log('- First 200 chars:', children[i].innerHTML.substring(0, 200));
        }
      }
    }
    
    // Extract scripts to understand the tab switching mechanism
    const scripts = doc.querySelectorAll('script');
    let tabScript = null;
    scripts.forEach(script => {
      const text = script.textContent || '';
      if (text.includes('simpleTabs') || text.includes('jQuery')) {
        tabScript = text.substring(0, 500);
      }
    });
    
    if (tabScript) {
      console.log('\n=== TAB SWITCHING SCRIPT (first 500 chars) ===');
      console.log(tabScript);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testKanjiStructure();
