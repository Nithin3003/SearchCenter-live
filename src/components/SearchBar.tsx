import { useState, FormEvent, ChangeEvent } from 'react';
import { Search, ArrowRight } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
  className?: string;
  size?: 'default' | 'large';
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  initialValue = '', 
  className = '',
  size = 'default' 
}) => {
  const [inputValue, setInputValue] = useState(initialValue);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Only update the local state, not trigger search
    setInputValue(e.target.value);
  };

  // Style classes based on size
  const sizeClasses = size === 'large' 
    ? 'py-3.5 pl-12 pr-36 text-lg' 
    : 'py-2 pl-10 pr-16 text-sm';

  const iconClass = size === 'large'
    ? 'h-6 w-6 left-4'
    : 'h-5 w-5 left-3';

  return (
    <form onSubmit={handleSubmit} className={`w-full ${className}`}>
      <div className="relative">
        <div className={`absolute inset-y-0 ${iconClass} flex items-center pointer-events-none text-gray-400`}>
          <Search className="w-full h-full" />
        </div>
        <input
          type="text"
          // Use the handleChange function
          className={`block w-full ${sizeClasses} border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-500 ${size === 'large' ? 'rounded-lg shadow-lg' : ''}`}
          placeholder="Search for code, repositories, or community discussions..."
          aria-label="Search"
        />
        {/* Show "Press Enter" indicator when input has content */}
        {inputValue.trim() && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-md text-sm flex items-center">
            Press Enter
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </div>
        )}
      </div>
    </form>
  );
};

export default SearchBar;