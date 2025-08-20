#!/usr/bin/env node

/**
 * Fix all createClient usage with 3 arguments
 * Migrate to proper SSR/CSR utilities
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/lib/admin-auth.ts',
  'src/lib/storage.ts', 
  'src/lib/auth/supabase-ssr.ts',
  'src/app/api/pdf/[id]/route.ts',
  'src/app/api/books/upload/route.ts',
  'src/app/api/books/[id]/route.ts',
  'src/app/api/users/create/route.ts',
  'src/app/api/books/route.ts',
  'src/app/api/auth/user/route.ts',
  'src/app/api/admin/fix-rls/route.ts',
  'src/app/api/topup/route.ts'
];

const fixes = [
  {
    // Fix createClient from @supabase/supabase-js imports
    pattern: /import\s+{\s*createClient[^}]*}\s+from\s+['"]@supabase\/supabase-js['"]/g,
    replacement: "import { createClient as createSupabaseClient } from '@supabase/supabase-js'"
  },
  {
    // Fix createServerClient imports
    pattern: /import\s+{\s*createServerClient[^}]*}\s+from\s+['"]@supabase\/ssr['"]/g,
    replacement: "import { createServerClient } from '@supabase/ssr'"
  },
  {
    // Fix 3-arg createClient to createSupabaseClient
    pattern: /const\s+(\w+)\s*=\s*createClient\s*\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!/g,
    replacement: 'const $1 = createSupabaseClient(\n    process.env.NEXT_PUBLIC_SUPABASE_URL!'
  },
  {
    // Add import for new server utility if needed
    pattern: /(import\s+{[^}]*}\s+from\s+['"]@supabase\/supabase-js['"])/g,
    replacement: (match) => {
      return `${match}\nimport { createClient } from '@/utils/supabase/server'`;
    }
  }
];

let totalFixed = 0;

for (const filePath of filesToFix) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Special handling for different file types
  if (filePath.includes('/api/')) {
    // API routes should use createSupabaseClient from @supabase/supabase-js
    if (content.includes('createClient(') && content.includes('process.env.NEXT_PUBLIC_SUPABASE_URL!')) {
      // Replace createClient with createSupabaseClient
      content = content.replace(
        /import\s+{\s*createClient\s*}\s+from\s+['"]@supabase\/supabase-js['"]/g,
        "import { createClient as createSupabaseClient } from '@supabase/supabase-js'"
      );
      
      content = content.replace(
        /const\s+(\w+)\s*=\s*createClient\s*\(/g,
        'const $1 = createSupabaseClient('
      );
      
      modified = true;
    }
  } else if (filePath.includes('lib/')) {
    // Library files may need different handling
    if (content.includes('createClient(') && content.includes('process.env.NEXT_PUBLIC_SUPABASE_URL!')) {
      // Check if it's already using createSupabaseClient
      if (!content.includes('createSupabaseClient')) {
        content = content.replace(
          /import\s+{\s*createClient\s*}\s+from\s+['"]@supabase\/supabase-js['"]/g,
          "import { createClient as createSupabaseClient } from '@supabase/supabase-js'"
        );
        
        content = content.replace(
          /createClient\s*\(/g,
          'createSupabaseClient('
        );
        
        modified = true;
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
    totalFixed++;
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
  }
}

console.log(`\n✨ Migration complete! Fixed ${totalFixed} files.`);
