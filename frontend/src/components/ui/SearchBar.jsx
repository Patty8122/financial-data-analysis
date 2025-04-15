import { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [searchType, setSearchType] = useState('nlp');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    sector: '',
    industry: '',
    minMarketCap: '',
    maxMarketCap: '',
    minVolume: ''
  });

  const handleSearch = async () => {
    if (searchType === 'nlp') {
      // NLP search
      const response = await fetch(`http://localhost:8000/api/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      onSearch(data.results);
    } else {
      // Structured search
      const params = new URLSearchParams();
      if (filters.sector) params.append('sector', filters.sector);
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.minMarketCap) params.append('min_market_cap', filters.minMarketCap);
      if (filters.maxMarketCap) params.append('max_market_cap', filters.maxMarketCap);
      if (filters.minVolume) params.append('min_volume', filters.minVolume);
      
      const response = await fetch(`http://localhost:8000/api/structured_search?${params.toString()}`);
      const data = await response.json();
      onSearch(data.results);
    }
  };

  return (
    <div className="mb-6 p-4 bg-white rounded shadow">
      <div className="flex mb-4">
        <button
          onClick={() => setSearchType('nlp')}
          className={`mr-2 px-4 py-2 rounded ${
            searchType === 'nlp' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Natural Language Search
        </button>
        <button
          onClick={() => setSearchType('structured')}
          className={`px-4 py-2 rounded ${
            searchType === 'structured' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Structured Filters
        </button>
      </div>

      {searchType === 'nlp' ? (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Describe the companies you're looking for..."
            className="w-full p-2 border rounded"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1">Sector</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={filters.sector}
              onChange={(e) => setFilters({...filters, sector: e.target.value})}
            />
          </div>
          <div>
            <label className="block mb-1">Industry</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={filters.industry}
              onChange={(e) => setFilters({...filters, industry: e.target.value})}
            />
          </div>
          <div>
            <label className="block mb-1">Min Market Cap ($M)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={filters.minMarketCap}
              onChange={(e) => setFilters({...filters, minMarketCap: e.target.value})}
            />
          </div>
          <div>
            <label className="block mb-1">Max Market Cap ($M)</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={filters.maxMarketCap}
              onChange={(e) => setFilters({...filters, maxMarketCap: e.target.value})}
            />
          </div>
          <div>
            <label className="block mb-1">Min Volume</label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              value={filters.minVolume}
              onChange={(e) => setFilters({...filters, minVolume: e.target.value})}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleSearch}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Search
      </button>
    </div>
  );
} 