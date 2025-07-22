"use client"

import { useState, useEffect } from 'react'
import { detectClientLanguage, setLanguagePreference } from '@/lib/language-detection'
import { Language, SUPPORTED_LANGUAGES, LANGUAGE_METADATA } from '@/lib/i18n'

export default function TestLanguageDetection() {
  const [detectedLanguage, setDetectedLanguage] = useState<Language>('vn')
  const [browserLanguages, setBrowserLanguages] = useState<string[]>([])
  const [acceptLanguage, setAcceptLanguage] = useState<string>('')

  useEffect(() => {
    // Test client-side detection
    const detected = detectClientLanguage()
    setDetectedLanguage(detected)

    // Get browser info
    if (typeof window !== 'undefined') {
      setBrowserLanguages([...navigator.languages])
      
      // Simulate Accept-Language header (in real scenario this comes from server)
      setAcceptLanguage(navigator.language)
    }
  }, [])

  const handleLanguageChange = (newLang: Language) => {
    setLanguagePreference(newLang)
    setDetectedLanguage(newLang)
    
    // Reload to test detection
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  const testRedirects = () => {
    const results = {
      root: `Detected: ${detectedLanguage} → Will redirect to: /auth/${detectedLanguage}/login`,
      landing: `Detected: ${detectedLanguage} → Will redirect to: /auth/${detectedLanguage}/landing`
    }
    alert(JSON.stringify(results, null, 2))
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">🔍 Language Detection Test Page</h1>
      
      {/* Current Detection Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Detection Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Detected Language:</strong> {detectedLanguage}</p>
            <p><strong>Language Name:</strong> {LANGUAGE_METADATA[detectedLanguage].name}</p>
            <p><strong>Native Name:</strong> {LANGUAGE_METADATA[detectedLanguage].nativeName}</p>
            <p><strong>Flag:</strong> {LANGUAGE_METADATA[detectedLanguage].flag}</p>
          </div>
          <div>
            <p><strong>Browser Language:</strong> {acceptLanguage}</p>
            <p><strong>All Browser Languages:</strong></p>
            <ul className="list-disc list-inside ml-4">
              {browserLanguages.map((lang, i) => (
                <li key={i}>{lang}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Language Switcher Test */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Language Switcher Test</h2>
        <p className="mb-4">Click to change language preference and test detection:</p>
        <div className="flex gap-4">
          {SUPPORTED_LANGUAGES.map(lang => (
            <button
              key={lang}
              onClick={() => handleLanguageChange(lang)}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                detectedLanguage === lang 
                  ? 'border-green-500 bg-green-100 text-green-800' 
                  : 'border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              {LANGUAGE_METADATA[lang].flag} {LANGUAGE_METADATA[lang].name}
            </button>
          ))}
        </div>
      </div>

      {/* Redirect Test */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Redirect Logic Test</h2>
        <p className="mb-4">Test what URLs the root and landing pages would redirect to:</p>
        <button
          onClick={testRedirects}
          className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          🧪 Test Redirect Logic
        </button>
      </div>

      {/* Current URLs Test */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Navigation Links Test</h2>
        <p className="mb-4">Test navigation to auth pages with detected language:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href={`/auth/${detectedLanguage}/landing`}
            className="block px-4 py-2 bg-purple-500 text-white rounded-lg text-center hover:bg-purple-600 transition-colors"
          >
            🏠 Landing Page
          </a>
          <a
            href={`/auth/${detectedLanguage}/login`}
            className="block px-4 py-2 bg-purple-500 text-white rounded-lg text-center hover:bg-purple-600 transition-colors"
          >
            🔐 Login Page
          </a>
          <a
            href={`/auth/${detectedLanguage}/register`}
            className="block px-4 py-2 bg-purple-500 text-white rounded-lg text-center hover:bg-purple-600 transition-colors"
          >
            📝 Register Page
          </a>
          <a
            href={`/auth/${detectedLanguage}/forgot-password`}
            className="block px-4 py-2 bg-purple-500 text-white rounded-lg text-center hover:bg-purple-600 transition-colors"
          >
            🔑 Forgot Password
          </a>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Check if detected language matches your browser language</li>
          <li>Try changing language using buttons above</li>
          <li>Test redirect logic button to see intended behavior</li>
          <li>Click navigation links to test actual auth pages</li>
          <li>Clear cookies and refresh to test fresh user detection</li>
        </ol>
      </div>
    </div>
  )
}
