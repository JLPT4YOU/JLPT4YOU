# API Keys Management in Settings

## Overview

JLPT4YOU now supports managing API keys for multiple AI providers directly in the Settings panel. This provides a centralized location for configuring and validating API keys for both Google Gemini and Groq providers.

## Features

### ✅ **Multi-Provider Support**
- Configure API keys for Google Gemini and Groq in one place
- Real-time validation for each provider
- Visual status indicators (configured/not configured)
- Provider-specific instructions and links

### ✅ **Enhanced Security**
- Password-style input fields with show/hide toggle
- Local storage only (keys never sent to servers)
- Clear functionality to remove keys
- Validation before saving

### ✅ **User Experience**
- Direct access from provider selector "Setup Required" button
- Auto-focus on API tab when configuring providers
- Clear visual feedback for validation status
- Provider-specific help and documentation links

## How to Use

### 1. Access Settings
There are multiple ways to access API key settings:

**Method 1: From Provider Selector**
1. Click the provider selector in the chat header
2. Click on a provider showing "Setup Required" badge
3. Settings modal opens with API tab focused

**Method 2: From Settings Menu**
1. Click the user menu in the top-right corner
2. Select "Settings"
3. Click on the "API Keys" tab

### 2. Configure API Keys

**For Google Gemini:**
1. Click "Get API key from Google AI Studio" link
2. Sign in to Google AI Studio and create an API key
3. Copy the key (format: `AIza...`)
4. Paste into the Gemini API Key field
5. Click "Validate Key" to test
6. Click "Save" to store locally

**For Groq (Llama):**
1. Click "Get API key from Groq Console" link
2. Sign up for Groq and create an API key
3. Copy the key (format: `gsk_...`)
4. Paste into the Groq API Key field
5. Click "Validate Key" to test
6. Click "Save" to store locally

### 3. Validation Status

Each API key shows real-time validation status:

- **🟡 Validating...**: Key is being tested
- **🟢 Valid**: Key is working correctly
- **🔴 Invalid**: Key has issues (wrong format, no permissions, etc.)
- **⚪ Idle**: No validation performed yet

### 4. Managing Keys

**Show/Hide Keys:**
- Click the eye icon to toggle password visibility
- Useful for checking key format or sharing screenshots

**Clear Keys:**
- Click "Clear" button to remove a key
- Removes from both UI and local storage
- Requires re-entering and validation

**Update Keys:**
- Simply paste a new key and validate
- Old key is automatically replaced when saved

## Provider Information

### Google Gemini
- **API Source**: [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Key Format**: `AIza...` (starts with AIza)
- **Features**: Thinking mode, file upload, Google Search, code execution
- **Free Tier**: 15 requests per minute
- **Best For**: Complex analysis, file processing, advanced reasoning

### Groq (Llama)
- **API Source**: [Groq Console](https://console.groq.com/keys)
- **Key Format**: `gsk_...` (starts with gsk_)
- **Features**: Ultra-fast inference, cost-effective, high throughput
- **Free Tier**: 30 requests per minute
- **Best For**: Quick responses, rapid prototyping, cost optimization

## Technical Implementation

### Settings Component Updates

The `UnifiedSettings` component has been enhanced with:

```typescript
// Multi-provider state management
const [apiKeys, setApiKeys] = useState<Record<ProviderType, string>>({
  gemini: '',
  groq: ''
});

const [keyValidationStatus, setKeyValidationStatus] = useState<Record<ProviderType, 'idle' | 'valid' | 'invalid'>>({
  gemini: 'idle',
  groq: 'idle'
});

// Provider-specific validation
const validateApiKey = async (provider: ProviderType, key: string) => {
  const aiProviderManager = getAIProviderManager();
  const isValid = await aiProviderManager.validateApiKey(provider, key);
  // Update status...
};
```

### Integration with Provider Manager

The settings integrate seamlessly with the AI Provider Manager:

```typescript
// Save and configure providers
const handleSave = async () => {
  const aiProviderManager = getAIProviderManager();
  
  if (apiKeys.gemini.trim()) {
    aiProviderManager.configureProvider('gemini', apiKeys.gemini);
  }
  
  if (apiKeys.groq.trim()) {
    aiProviderManager.configureProvider('groq', apiKeys.groq);
  }
};
```

### Auto-Focus API Tab

When users click "Setup Required" from the provider selector:

```typescript
onConfigureProvider={(provider) => {
  setSettingsDefaultTab("api");  // Focus API tab
  setShowSettings(true);         // Open settings modal
}}
```

## Benefits

### 🎯 **Centralized Management**
- All API keys in one location
- Consistent interface across providers
- Easy to find and update

### 🔒 **Enhanced Security**
- Visual confirmation of key format
- Validation before storage
- Clear removal process

### 🚀 **Better UX**
- Direct access from provider selector
- Auto-focus on relevant tab
- Clear status indicators

### 🔧 **Developer Friendly**
- Extensible for new providers
- Consistent validation patterns
- Reusable components

## Troubleshooting

### Common Issues

**API Key Not Working:**
1. Check the key format (Gemini: `AIza...`, Groq: `gsk_...`)
2. Verify permissions in provider console
3. Check quota limits
4. Try regenerating the key

**Validation Fails:**
1. Ensure internet connection
2. Check if provider service is down
3. Verify key hasn't expired
4. Try a different key

**Settings Not Saving:**
1. Check browser local storage permissions
2. Try clearing browser cache
3. Ensure JavaScript is enabled
4. Check for browser extensions blocking storage

### Getting Help

1. **Provider Documentation:**
   - [Google AI Studio Help](https://ai.google.dev/docs)
   - [Groq API Documentation](https://console.groq.com/docs)

2. **Test Integration:**
   - Use the `ProviderTestDemo` component
   - Check browser console for errors
   - Verify network requests in DevTools

3. **Reset Everything:**
   - Clear all API keys
   - Refresh the page
   - Re-enter keys one by one

## Security Considerations

### ⚠️ **Important Security Notes**

**Client-Side API Usage:**
- This implementation uses client-side API calls for development convenience
- API keys are exposed in the browser environment
- For production use, consider implementing a server-side proxy

**Groq Browser Usage:**
- Groq SDK requires `dangerouslyAllowBrowser: true` flag
- This is necessary for client-side usage but has security implications
- Consider server-side implementation for production environments

**Best Practices:**
- Use API keys with minimal required permissions
- Regularly rotate your API keys
- Monitor usage in provider consoles
- Consider rate limiting and usage quotas
- API keys are stored locally in your browser only
- Keys are not sent to JLPT4YOU servers
- Each provider validates keys directly
- You can remove keys anytime in the settings

## Future Enhancements

Planned improvements for the API key management system:

- **Bulk Import/Export**: Import/export all keys at once
- **Key Rotation**: Automatic key rotation reminders
- **Usage Tracking**: Monitor API usage per provider
- **Team Management**: Share keys across team members
- **Environment Profiles**: Different keys for dev/prod

The current implementation provides a solid foundation for these future enhancements while maintaining simplicity and security.
