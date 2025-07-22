"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Zap, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Clock,
  MessageSquare
} from 'lucide-react';
import { getAIProviderManager, type ProviderType } from '@/lib/ai-provider-manager';
import { createAIMessage } from '@/lib/ai-service';

interface TestResult {
  provider: ProviderType;
  success: boolean;
  response?: string;
  error?: string;
  duration?: number;
}

export const ProviderTestDemo: React.FC = () => {
  const [testMessage, setTestMessage] = useState('Xin chào! Bạn có thể giới thiệu về bản thân không?');
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [isTestingGroq, setIsTestingGroq] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [providerStatus, setProviderStatus] = useState<Record<ProviderType, boolean>>({
    gemini: false,
    groq: false
  });

  const aiProviderManager = getAIProviderManager();

  // Check provider status on mount
  useEffect(() => {
    const checkStatus = () => {
      const geminiConfigured = aiProviderManager.isProviderConfigured('gemini');
      const groqConfigured = aiProviderManager.isProviderConfigured('groq');
      
      setProviderStatus({
        gemini: geminiConfigured,
        groq: groqConfigured
      });
    };

    checkStatus();
    
    // Check status every 2 seconds in case user configures providers
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const testProvider = async (provider: ProviderType) => {
    if (!providerStatus[provider]) {
      alert(`${provider} is not configured. Please set up API key first.`);
      return;
    }

    const setLoading = provider === 'gemini' ? setIsTestingGemini : setIsTestingGroq;
    setLoading(true);

    const startTime = Date.now();

    try {
      // Switch to the provider
      aiProviderManager.switchProvider(provider);
      
      // Create test message
      const messages = [createAIMessage(testMessage, 'user')];
      
      // Send message
      const response = await aiProviderManager.sendMessage(messages);
      const duration = Date.now() - startTime;

      const result: TestResult = {
        provider,
        success: true,
        response,
        duration
      };

      setTestResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        provider,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };

      setTestResults(prev => [result, ...prev.slice(0, 4)]);
    } finally {
      setLoading(false);
    }
  };

  const testStreamingProvider = async (provider: ProviderType) => {
    if (!providerStatus[provider]) {
      alert(`${provider} is not configured. Please set up API key first.`);
      return;
    }

    const setLoading = provider === 'gemini' ? setIsTestingGemini : setIsTestingGroq;
    setLoading(true);

    const startTime = Date.now();
    let streamedResponse = '';

    try {
      // Switch to the provider
      aiProviderManager.switchProvider(provider);
      
      // Create test message
      const messages = [createAIMessage(testMessage, 'user')];
      
      // Stream message
      await aiProviderManager.streamMessage(messages, (chunk) => {
        streamedResponse += chunk;
        console.log(`${provider} chunk:`, chunk);
      });

      const duration = Date.now() - startTime;

      const result: TestResult = {
        provider,
        success: true,
        response: streamedResponse,
        duration
      };

      setTestResults(prev => [result, ...prev.slice(0, 4)]);
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        provider,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };

      setTestResults(prev => [result, ...prev.slice(0, 4)]);
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider: ProviderType) => {
    return provider === 'gemini' ? <Brain className="h-4 w-4" /> : <Zap className="h-4 w-4" />;
  };

  const getProviderName = (provider: ProviderType) => {
    return provider === 'gemini' ? 'Google Gemini' : 'Groq (Llama)';
  };

  const getProviderColor = (provider: ProviderType) => {
    return provider === 'gemini' ? 'provider-primary' : 'provider-secondary';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">AI Provider Testing</h2>
        <p className="text-muted-foreground">
          Test both Gemini and Groq providers to compare responses and performance
        </p>
      </div>

      {/* Test Message Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Test Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter your test message..."
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Provider Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gemini Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Google Gemini
              </div>
              {providerStatus.gemini ? (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Setup Required
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => testProvider('gemini')}
              disabled={!providerStatus.gemini || isTestingGemini || !testMessage.trim()}
              className="w-full"
            >
              {isTestingGemini ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Testing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Test Regular
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => testStreamingProvider('gemini')}
              disabled={!providerStatus.gemini || isTestingGemini || !testMessage.trim()}
              className="w-full"
            >
              Test Streaming
            </Button>
          </CardContent>
        </Card>

        {/* Groq Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Groq (Llama)
              </div>
              {providerStatus.groq ? (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Setup Required
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={() => testProvider('groq')}
              disabled={!providerStatus.groq || isTestingGroq || !testMessage.trim()}
              className="w-full"
            >
              {isTestingGroq ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Testing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Test Regular
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => testStreamingProvider('groq')}
              disabled={!providerStatus.groq || isTestingGroq || !testMessage.trim()}
              className="w-full"
            >
              Test Streaming
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success ? 'interactive-success' : 'interactive-error'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getProviderIcon(result.provider)}
                    <span className="font-medium">{getProviderName(result.provider)}</span>
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 icon-correct" />
                    ) : (
                      <AlertCircle className="h-4 w-4 icon-incorrect" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {result.duration}ms
                  </div>
                </div>
                
                {result.success ? (
                  <div className="text-sm">
                    <p className="font-medium mb-1">Response:</p>
                    <p className="text-muted-foreground">{result.response}</p>
                  </div>
                ) : (
                  <div className="text-sm">
                    <p className="font-medium mb-1 text-destructive">Error:</p>
                    <p className="text-destructive">{result.error}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
