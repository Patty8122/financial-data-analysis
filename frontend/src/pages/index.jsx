import React, { useState } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import SearchBar from '../components/ui/SearchBar';

export default function Home() {
  const [searchResults, setSearchResults] = useState([]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Financial Data Explorer</h1>
      
      <SearchBar onSearch={setSearchResults} />
      
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Search Results ({searchResults.length})</h2>
        
        {searchResults.length > 0 ? (
          <div className="grid gap-4">
            {searchResults.map((stock) => (
              <div key={stock.id} className="border p-4 rounded">
                <h3 className="font-bold">{stock.symbol} - {stock.name}</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>Sector: {stock.sector}</div>
                  <div>Industry: {stock.industry}</div>
                  <div>Market Cap: ${(stock.market_cap / 1000000).toFixed(2)}M</div>
                  <div>Volume: {stock.volume.toLocaleString()}</div>
                </div>
                <p className="mt-2 text-gray-600">{stock.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No results to display. Try searching for something!</p>
        )}
      </div>
    </div>
  );
}
