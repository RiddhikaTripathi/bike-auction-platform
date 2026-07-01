import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Package, ChevronDown } from 'lucide-react';
import { useBikes, useCategories } from '../hooks/useBikes';
import { BikeCard } from '../components/auction/BikeCard';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/Loading';
import type { Bike } from '../types/database';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<Bike['status'] | 'all'>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const searchQuery = searchParams.get('search') || '';

  const { bikes, loading, error, refetch } = useBikes({
    status: activeFilter !== 'all' ? activeFilter : undefined,
    categoryId: selectedCategory || undefined,
    searchQuery: searchQuery || undefined,
  });

  const { categories } = useCategories();

  useEffect(() => {
    refetch();
  }, [activeFilter, selectedCategory, searchQuery, refetch]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Dream Motorcycle
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8">
              Discover premium used motorcycles at auction prices. Bid live, win your dream ride, and own your favorite motorcycle.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search motorcycles, brands, models..."
                defaultValue={searchQuery}
                onChange={(e) => {
                  if (e.target.value) {
                    setSearchParams({ search: e.target.value });
                  } else {
                    setSearchParams({});
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-3">
              {/* Status Filter */}
              <div className="flex bg-slate-100 rounded-lg p-1">
                {(['active', 'all', 'closed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setActiveFilter(status)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeFilter === status
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={refetch}>
              Try Again
            </Button>
          </div>
        ) : bikes.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No auctions found</h3>
            <p className="text-slate-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Check back later for new auctions'}
            </p>
            <Button variant="outline" onClick={() => {
              setActiveFilter('active');
              setSelectedCategory('');
              setSearchParams({});
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-600">
                Showing <span className="font-semibold text-slate-900">{bikes.length}</span> auctions
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bikes.map((bike) => (
                <BikeCard key={bike.id} bike={bike} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
