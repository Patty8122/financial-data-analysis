import React, { useState } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function Home() {
  // ... (rest of your component logic - state, handlers)

  const [ticker, setTicker] = useState('');
  const [tickerInfo, setTickerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [qnaQuery, setQnaQuery] = useState('');
  const [conversation, setConversation] = useState([]);
  const [qnaLoading, setQnaLoading] = useState(false);
  const [qnaError, setQnaError] = useState('');

  const [sessionId, setSessionId] = useState(null);

  const handleSearch = async () => {
    if (!ticker) {
      setError('Please enter a ticker symbol');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/ticker_info/${ticker.toUpperCase()}`);
      if (!response.ok) throw new Error('Failed to fetch ticker information');
      const data = await response.json();
      setTickerInfo(data);
    } catch (err) {
      setError(err.message);
      setTickerInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSearch = async () => {
    if (!query) {
      setSearchError('Please enter a search query');
      return;
    }
    setSearchLoading(true);
    setSearchError('');
    try {
      const response = await fetch('/text_search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) throw new Error('Failed to perform text search');
      const data = await response.json();
      setSearchResult(data);
    } catch (err) {
      setSearchError(err.message);
      setSearchResult(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleQnaSearch = async () => {
    if (!qnaQuery) {
      setQnaError('Please enter a question');
      return;
    }
    setQnaLoading(true);
    setQnaError('');
    try {
      const response = await fetch('/qna_search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: qnaQuery, session_id: sessionId }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        const errorMessage = data.detail || 'Failed to perform QnA search';
        throw new Error(errorMessage);
      }

      if (!sessionId) setSessionId(data.session_id);
      setConversation((prev) => [...prev, { question: qnaQuery, answer: data.answer }]);
      setQnaQuery('');
    } catch (err) {
      console.error('QnA Error:', err);
      setQnaError(err.message);
    } finally {
      setQnaLoading(false);
    }
  };

  const handleClearChat = () => {
    setConversation([]);
    setSessionId(null);
    setQnaQuery('');
    setQnaError('');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text mb-8 text-center">
            Financial Data Explorer
          </h1>

          <div className="grid md:grid-cols-2 grid-cols-1 gap-6 mt-6"> {/* Added mt-6 for margin below the title */}
            {/* Left Panel: Stock & Company Research */}
            <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-md p-6 h-full"> {/* Slightly different shadow */}
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
                Stock & Company Research
              </h2>

              {/* Stock Information Section */}
              <div className="mb-8">
                <h3 className="text-md font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Stock Information
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Enter ticker symbol (e.g., AAPL)"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4"
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  {tickerInfo && (
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border dark:border-slate-600"> {/* Added border */}
                      <h4 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                        {tickerInfo.ticker}
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {tickerInfo.text}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Search Section */}
              <div>
                <h3 className="text-md font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Company Search
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Search companies (e.g., healthcare companies)"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleTextSearch}
                      disabled={searchLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4"
                    >
                      {searchLoading ? 'Searching...' : 'Search'}
                    </Button>
                  </div>
                  {searchError && <p className="text-red-500 text-sm">{searchError}</p>}
                  {searchResult && (
                    <div className="space-y-4">
                      {searchResult.map((result, index) => (
                        <div key={index} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border dark:border-slate-600"> {/* Added border */}
                          <h4 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                            {result.ticker}
                          </h4>
                          <p className="text-sm text-slate-700 dark:text-slate-300">
                            {result.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel: AI Assistant */}
            <div className="bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-md flex flex-col h-full"> {/* Slightly different shadow */}
              {/* Chat Header */}
              <div className="p-6 border-b dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                      {/* Placeholder for an icon if needed */}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800 dark:text-white">AI Assistant</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Ask me anything about companies</p>
                    </div>
                  </div>
                  {conversation.length > 0 && (
                    <Button
                      onClick={handleClearChat}
                      variant="ghost"
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Clear Chat
                    </Button>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {conversation.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mx-auto">
                        {/* Placeholder for an icon if needed */}
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">
                        Start a conversation by asking about any company or financial topic.
                      </p>
                    </div>
                  </div>
                ) : (
                  conversation.map((entry, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-end">
                        <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-2 max-w-[80%] shadow-sm"> {/* Added shadow */}
                          <p className="text-sm">{entry.question}</p>
                        </div>
                      </div>
                      <div className="flex">
                        <div className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-none px-4 py-2 max-w-[80%] shadow-sm"> {/* Added shadow */}
                          <p className="text-sm whitespace-pre-wrap">{entry.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <div className="p-6 border-t dark:border-slate-700">
                <div className="flex gap-3">
                  <Input
                    placeholder="Type your message..."
                    value={qnaQuery}
                    onChange={(e) => setQnaQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleQnaSearch()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleQnaSearch}
                    disabled={qnaLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6"
                  >
                    {qnaLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Thinking</span>
                      </div>
                    ) : (
                      'Send'
                    )}
                  </Button>
                </div>
                {qnaError && (
                  <p className="mt-2 text-sm text-red-500">{qnaError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
