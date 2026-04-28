import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  showClearButton?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search anything...",
  onSearch,
  className,
  showClearButton = true
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch?.('');
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
      <input 
        type="text" 
        placeholder={placeholder}
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        className="bg-card/50 text-foreground rounded-lg pl-10 pr-12 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary border border-border transition-all"
      />
      {showClearButton && query && (
        <button 
          onClick={clearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};