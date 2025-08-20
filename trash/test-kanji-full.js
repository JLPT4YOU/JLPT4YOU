// Comprehensive test to understand how to split Kanji content
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { JSDOM } = require('jsdom');

async function analyzeKanjiContent() {
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
    
    // Get tab buttons
    const tabButtons = kanjiArticle.querySelectorAll('.simpleTabs .stn li a');
    const kanjiChars = Array.from(tabButtons).map(btn => btn.textContent.trim());
    console.log('Kanji characters:', kanjiChars);
    
    // Analyze the pattern - check if there are multiple .dc divs
    const dcDivs = kanjiArticle.querySelectorAll('.simpleTabs .stc .dc');
    console.log('\nNumber of .dc divs:', dcDivs.length);
    
    // Check for tables (vocabulary examples)
    const tables = kanjiArticle.querySelectorAll('.simpleTabs .stc table');
    console.log('Number of tables:', tables.length);
    
    // Let's look at the full HTML to understand the pattern
    const stc = kanjiArticle.querySelector('.simpleTabs .stc');
    if (stc) {
      const stcHTML = stc.innerHTML;
      
      // Look for patterns that might separate content
      const drawDivs = stcHTML.match(/<div id="draw\d+"><\/div>/g);
      console.log('\nDraw divs found:', drawDivs ? drawDivs.length : 0);
      
      // Check if there's a pattern with .dc class
      const dcPattern = stcHTML.split('<div class="dc">');
      console.log('Split by dc class:', dcPattern.length - 1, 'sections');
      
      // Try to identify where first Kanji content ends and second begins
      // Look for second draw div
      const secondDrawMatch = stcHTML.match(/(<div class="dc">[\s\S]*?<\/table>)/g);
      if (secondDrawMatch) {
        console.log('\nPossible content blocks found:', secondDrawMatch.length);
      }
      
      // Let's look at specific markers
      console.log('\n=== CONTENT STRUCTURE ===');
      
      // Find all .pi divs (property info)
      const piDivs = stc.querySelectorAll('.pi');
      console.log('Property info divs (.pi):', piDivs.length);
      
      // Check if there's a repeating pattern
      let currentKanjiIndex = 0;
      let contentBlocks = [];
      let currentBlock = { kanji: kanjiChars[0], elements: [] };
      
      const children = Array.from(stc.children);
      children.forEach((child, i) => {
        // Check if this is a new .dc div (marks new Kanji block)
        if (child.classList.contains('dc') && i > 0) {
          // Save current block and start new one
          contentBlocks.push(currentBlock);
          currentKanjiIndex++;
          currentBlock = { 
            kanji: kanjiChars[currentKanjiIndex] || `Unknown${currentKanjiIndex}`,
            elements: []
          };
        }
        currentBlock.elements.push({
          tag: child.tagName,
          class: child.className,
          preview: child.textContent.substring(0, 50)
        });
      });
      contentBlocks.push(currentBlock);
      
      console.log('\nContent blocks identified:', contentBlocks.length);
      contentBlocks.forEach((block, i) => {
        console.log(`\nBlock ${i} - Kanji: "${block.kanji}"`);
        console.log(`Elements: ${block.elements.length}`);
        block.elements.slice(0, 3).forEach(el => {
          console.log(`  - ${el.tag}.${el.class}: "${el.preview}..."`);
        });
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeKanjiContent();
