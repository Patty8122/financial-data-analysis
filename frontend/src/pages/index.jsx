import React, { useState } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function Home() {
  const [ticker, setTicker] = useState('');
  const [tickerInfo, setTickerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Text search states
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // QnA search states
  const [qnaQuery, setQnaQuery] = useState('');
  const [conversation, setConversation] = useState([]);
  const [qnaLoading, setQnaLoading] = useState(false);
  const [qnaError, setQnaError] = useState('');

  const handleSearch = async () => {
    if (!ticker) {
      setError('Please enter a ticker symbol');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/ticker_info/${ticker.toUpperCase()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ticker information');
      }
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        throw new Error('Failed to perform text search');
      }
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: qnaQuery }),
      });
      if (!response.ok) {
        throw new Error('Failed to perform QnA search');
      }
      const data = await response.json();
      setConversation((prev) => [
        ...prev,
        { question: qnaQuery, answer: data.answer },
      ]);
      setQnaQuery('');
    } catch (err) {
      setQnaError(err.message);
    } finally {
      setQnaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-8 text-center">
          Financial Data Explorer
        </h1>
        
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Ticker Search Section */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Stock Information Lookup
            </h2>
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Input
                    placeholder="Enter ticker symbol (e.g., AAPL)"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button 
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                
                {error && (
                  <p className="text-red-500 mt-2">{error}</p>
                )}
              </CardContent>
            </Card>

            {tickerInfo && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold text-blue-600 mb-4">
                    {tickerInfo.ticker}
                  </h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {tickerInfo.text}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Text Search Section */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Search Company Information
            </h2>
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Input
                    placeholder="Ask a question about companies (e.g., Which companies are in the healthcare sector?)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
                  />
                  <Button 
                    onClick={handleTextSearch}
                    disabled={searchLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {searchLoading ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                
                {searchError && (
                  <p className="text-red-500 mt-2">{searchError}</p>
                )}
              </CardContent>
            </Card>

            {searchResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResult.map((result, index) => (
                  <div key={index} className="p-4 bg-white rounded shadow">
                    <h3 className="text-lg font-semibold text-blue-600">{result.ticker}</h3>
                    <p className="text-gray-700">{result.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QnA Search Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Conversational Agent</h2>
            <div className="bg-gray-100 p-4 rounded shadow">
              <div className="mb-4">
                <input
                  type="text"
                  value={qnaQuery}
                  onChange={(e) => setQnaQuery(e.target.value)}
                  placeholder="Ask a question..."
                  className="w-full p-2 border rounded"
                  onKeyPress={(e) => e.key === 'Enter' && handleQnaSearch()}
                />
                <button
                  onClick={handleQnaSearch}
                  disabled={qnaLoading}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  {qnaLoading ? 'Searching...' : 'Ask'}
                </button>
              </div>
              {qnaError && <p className="text-red-500">{qnaError}</p>}
              <div className="mt-4">
                {conversation.map((entry, index) => (
                  <div key={index} className="mb-4">
                    <p className="font-semibold text-blue-600">Q: {entry.question}</p>
                    <p className="text-gray-700">A: {entry.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
