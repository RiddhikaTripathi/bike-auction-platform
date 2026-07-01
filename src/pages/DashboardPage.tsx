import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Gavel,
  Clock,
  AlertCircle,
  Eye,
  Settings,
  ChevronRight,
  TrendingUp,
  DollarSign,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBikes } from '../hooks/useBikes';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatRelativeTime, getStatusColor, cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { LoadingSpinner } from '../components/ui/Loading';
import toast from 'react-hot-toast';

export function DashboardPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'selling' | 'bidding' | 'watching'>('selling');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { bikes: sellerBikes, loading: sellerLoading, refetch: refetchSeller } = useBikes({
    sellerId: user?.id,
  });

  // Stats
  const activeListings = sellerBikes.filter((b) => b.status === 'active').length;
  const closedListings = sellerBikes.filter((b) => b.status === 'closed').length;
  const totalValue = sellerBikes
    .filter((b) => b.status === 'closed' && b.winner_id)
    .reduce((acc, b) => acc + (b.current_price || 0), 0);

  const tabs = [
    { id: 'selling', label: 'My Listings', icon: Package },
    { id: 'bidding', label: 'My Bids', icon: Gavel },
    { id: 'watching', label: 'Watchlist', icon: Eye },
  ];

  const handleCancelAuction = async (bikeId: string) => {
    if (!confirm('Are you sure you want to cancel this auction?')) return;

    setLoadingId(bikeId);
    const { error } = await supabase
      .from('bikes')
      .update({ status: 'cancelled' })
      .eq('id', bikeId);

    if (error) {
      toast.error('Failed to cancel auction');
    } else {
      toast.success('Auction cancelled');
      refetchSeller();
    }
    setLoadingId(null);
  };

  const handlePublishDraft = async (bikeId: string) => {
    if (!confirm('Are you sure you want to publish this auction?')) return;

    setLoadingId(bikeId);
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 7);

    const { error } = await supabase
      .from('bikes')
      .update({ status: 'active', end_time: endTime.toISOString() })
      .eq('id', bikeId);

    if (error) {
      toast.error('Failed to publish auction');
    } else {
      toast.success('Auction published!');
      refetchSeller();
    }
    setLoadingId(null);
  };

  if (sellerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Manage your auctions and track your bids</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Active Listings</p>
                  <p className="text-3xl font-bold text-slate-900">{activeListings}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Completed Auctions</p>
                  <p className="text-3xl font-bold text-slate-900">{closedListings}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Sales</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {formatCurrency(totalValue)}
                  </p>
                </div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors',
                  activeTab === tab.id
                    ? 'text-emerald-600 bg-emerald-50 border-b-2 border-emerald-600'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'selling' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-slate-900">Your Listings</h2>
                  <Link to="/create">
                    <Button variant="primary" size="sm">
                      Create Auction
                    </Button>
                  </Link>
                </div>

                {sellerBikes.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No listings yet</h3>
                    <p className="text-slate-600 mb-6">Create your first auction to get started</p>
                    <Link to="/create">
                      <Button variant="primary">Create Auction</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {sellerBikes.map((bike) => (
                      <div
                        key={bike.id}
                        className="flex items-center justify-between py-4 group hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={bike.image_urls?.[0] || 'https://via.placeholder.com/80'}
                            alt={bike.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <Link
                              to={`/auction/${bike.id}`}
                              className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors"
                            >
                              {bike.title}
                            </Link>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge
                                variant={bike.status === 'active' ? 'success' : 'default'}
                                size="sm"
                              >
                                {bike.status}
                              </Badge>
                              <span className="text-sm text-slate-500">
                                {formatCurrency(bike.current_price)}
                              </span>
                              <span className="text-sm text-slate-400">
                                {formatRelativeTime(bike.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {bike.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              loading={loadingId === bike.id}
                              onClick={() => handlePublishDraft(bike.id)}
                            >
                              Publish
                            </Button>
                          )}
                          {bike.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={loadingId === bike.id}
                              onClick={() => handleCancelAuction(bike.id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              Cancel
                            </Button>
                          )}
                          <Link to={`/auction/${bike.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bidding' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Your Active Bids</h2>
                <div className="text-center py-12">
                  <Gavel className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No active bids</h3>
                  <p className="text-slate-600 mb-6">Start bidding on auctions to see them here</p>
                  <Link to="/">
                    <Button variant="primary">Browse Auctions</Button>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'watching' && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900 mb-6">Your Watchlist</h2>
                <div className="text-center py-12">
                  <Eye className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Watchlist coming soon</h3>
                  <p className="text-slate-600">
                    Save auctions you're interested in for later
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
