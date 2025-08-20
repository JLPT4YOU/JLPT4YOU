#!/bin/bash

echo "🔧 Fixing remaining legacy imports..."

# Fix supabaseAdmin imports
echo "📝 Updating supabaseAdmin imports..."
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  "s|import { supabaseAdmin } from '@/lib/supabase'|import { supabaseAdmin } from '@/utils/supabase/admin'|g" {} \;

# Fix supabase and supabaseAdmin combined imports
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  "s|import { supabase, supabaseAdmin } from '@/lib/supabase'|import { createClient } from '@/utils/supabase/client'\nimport { supabaseAdmin } from '@/utils/supabase/admin'|g" {} \;

# Fix supabase only imports
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  "s|import { supabase } from '@/lib/supabase'|import { createClient } from '@/utils/supabase/client'|g" {} \;

# Fix any remaining auth-context imports
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  "s|from '@/contexts/auth-context'|from '@/contexts/auth-context-simple'|g" {} \;

echo "✅ Import fixes complete!"
