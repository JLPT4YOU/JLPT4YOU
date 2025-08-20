-- Migration: create user_api_keys table with Supabase pgcrypto encryption
-- Each user manages their own API keys, encrypted at rest

-- Enable pgcrypto extension in extensions schema (Supabase standard)
create extension if not exists pgcrypto with schema extensions;

-- Drop table if exists (for testing/re-runs)
drop table if exists public.user_api_keys cascade;

create table if not exists public.user_api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  provider text not null check (provider in ('gemini','groq')),
  key_encrypted text not null, -- Base64 encoded encrypted data
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

-- Row Level Security: users can only access their own keys
alter table public.user_api_keys enable row level security;

-- Drop existing policies if they exist
drop policy if exists "user_can_manage_own_keys" on public.user_api_keys;

create policy "user_can_manage_own_keys"
  on public.user_api_keys
  for all
  using (auth.uid() = user_id);

-- Helper functions for encryption/decryption using extensions schema
create or replace function public.encrypt_api_key(api_key text, user_secret text)
returns text
language sql
security definer
as $$
  select encode(extensions.pgp_sym_encrypt(api_key, user_secret), 'base64');
$$;

create or replace function public.decrypt_api_key(encrypted_key text, user_secret text)
returns text
language sql
security definer
as $$
  select extensions.pgp_sym_decrypt(decode(encrypted_key, 'base64'), user_secret);
$$;

-- Test the functions work
do $$
declare
  test_key text := 'test-api-key-123';
  test_secret text := 'test-secret-xyz';
  encrypted text;
  decrypted text;
begin
  -- Test encryption
  select public.encrypt_api_key(test_key, test_secret) into encrypted;
  raise notice 'Encrypted: %', encrypted;
  
  -- Test decryption
  select public.decrypt_api_key(encrypted, test_secret) into decrypted;
  raise notice 'Decrypted: %', decrypted;
  
  -- Verify they match
  if decrypted = test_key then
    raise notice '✅ Encryption/Decryption test PASSED';
  else
    raise exception '❌ Encryption/Decryption test FAILED';
  end if;
end
$$;
