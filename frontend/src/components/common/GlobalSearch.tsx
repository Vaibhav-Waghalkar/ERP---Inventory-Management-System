import { useState, useEffect, useRef } from 'react';
import { Search, X, Package, FileText, Building2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { itemService, categoryService } from '../../services/store.service';
import { useQuery } from '@tanstack/react-query';

interface SearchResult {
  type: 'item' | 'category' | 'user';
  id: string;
  title: string;
  subtitle?: string;
  path: string;
}

export const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: items } = useQuery({
    queryKey: ['search-items'],
    queryFn: () => itemService.getAll(),
    enabled: isOpen && searchTerm.length > 0,
  });

  const { data: categories } = useQuery({
    queryKey: ['search-categories'],
    queryFn: () => categoryService.getAll(),
    enabled: isOpen && searchTerm.length > 0,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const searchResults: SearchResult[] = [];

    // Search items
    items?.forEach((item) => {
      if (
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        searchResults.push({
          type: 'item',
          id: item.id,
          title: item.name,
          subtitle: item.category?.name,
          path: `/store/stock`,
        });
      }
    });

    // Search categories
    categories?.forEach((category) => {
      if (category.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        searchResults.push({
          type: 'category',
          id: category.id,
          title: category.name,
          subtitle: `${category._count?.items || 0} items`,
          path: `/store/stock`,
        });
      }
    });

    setResults(searchResults.slice(0, 10)); // Limit to 10 results
  }, [searchTerm, items, categories]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    setIsOpen(false);
    setSearchTerm('');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'item':
        return <Package className="w-4 h-4" />;
      case 'category':
        return <FileText className="w-4 h-4" />;
      case 'user':
        return <User className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Search className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">Search...</span>
        <kbd className="hidden md:inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
          Ctrl+K
        </kbd>
      </button>
    );
  }

  return (
    <div ref={searchRef} className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-gray-200">
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search items, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="flex-1 outline-none text-gray-900 placeholder-gray-400"
          />
          <button
            onClick={() => {
              setIsOpen(false);
              setSearchTerm('');
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <div className="p-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <div className="text-gray-400">{getIcon(result.type)}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{result.title}</div>
                    {result.subtitle && (
                      <div className="text-sm text-gray-500">{result.subtitle}</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">{result.type}</div>
                </button>
              ))}
            </div>
          ) : searchTerm.length >= 2 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No results found</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>Type at least 2 characters to search</p>
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          <kbd className="px-2 py-1 bg-white border border-gray-200 rounded">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
};

