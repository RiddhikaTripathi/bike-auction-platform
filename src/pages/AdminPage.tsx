import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Package,
  Users,
  DollarSign,
  Settings,
  AlertCircle,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  PlayCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Bike, BikeWithDetails, Profile, Bid } from '../types/database';
import { formatCurrency, formatDateTime, formatRelativeTime, cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { LoadingSpinner, LoadingOverlay } from '../components/ui/Loading';
import toast from 'react-hot-toast';
import { AdminRoute } from '../components/layout/Layout';

export function AdminPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'auctions' | 'users' | 'stats'>('auctions');
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<BikeWithDetails[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedAuction, setSelectedAuction] = useState<BikeWithDetails | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [bidsModalOpen, setBidsModalOpen] = useState(false);
  const [selectedBids, setSelectedBids] = useState<Bid[]>([]);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchData();
    }
  }, [profile?.is_admin]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch all auctions with details
    const { data: auctionData } = await supabase
      .from('bikes')
      .select(`
        *,
        category:categories!category_id (id, name, description, created_at),
        seller:profiles!seller_id (id, display_name, avatar_url),
        winner:profiles!winner_id (id, display_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (auctionData) {
      setAuctions(auctionData as unknown as BikeWithDetails[]);
    }

    // Fetch users (admin only via service role would be needed in production)
    const { data: userData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (userData) {
      setUsers(userData);
    }

    setLoading(false);
  };

  const handleStatusChange = async (auctionId: string, newStatus: Bike['status']) => {
    setActionLoading(true);

    const { error } = await supabase
      .from('bikes')
      .update({ status: newStatus })
      .eq('id', auctionId);

    if (error) {
      toast.error('Failed to update auction status');
    } else {
      toast.success('Auction status updated');
      fetchData();
    }

    setActionLoading(false);
  };

  const handleViewBids = async (auction: BikeWithDetails) => {
    setSelectedAuction(auction);
    const { data } = await supabase
      .from('bids')
      .select('*')
      .eq('bike_id', auction.id)
      .order('amount', { ascending: false });

    if (data) {
      setSelectedBids(data);
    }
    setBidsModalOpen(true);
  };

  const handleSelectWinner = async (auctionId: string, winnerId: string) => {
    setActionLoading(true);

    // Update auction with winner
    const { error } = await supabase
      .from('bikes')
      .update({
        winner_id: winnerId,
        status: 'closed'
      })
      .eq('id', auctionId);

    if (error) {
      toast.error('Failed to select winner');
    } else {
      toast.success('Winner selected and auction closed!');
      fetchData();
      setBidsModalOpen(false);
    }

    setActionLoading(false);
  };

  const stats = {
    totalAuctions: auctions.length,
    activeAuctions: auctions.filter((a) => a.status === 'active').length,
    closedAuctions: auctions.filter((a) => a.status === 'closed').length,
    totalValue: auctions.reduce((acc, a) => acc + a.current_price, 0),
    totalUsers: users.length,
    adminUsers: users.filter((u) => u.is_admin).length,
  };

  if (!profile?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-amber-500 rounded-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400">Manage auctions, users, and platform settings</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Auctions', value: stats.totalAuctions, icon: Package, color: 'bg-blue-500' },
            { label: 'Active', value: stats.activeAuctions, icon: PlayCircle, color: 'bg-emerald-500' },
            { label: 'Closed', value: stats.closedAuctions, icon: CheckCircle, color: 'bg-amber-500' },
            { label: 'Total Value', value: formatCurrency(stats.totalValue), icon: DollarSign, color: 'bg-emerald-500' },
            { label: 'Users', value: stats.totalUsers, icon: Users, color: 'bg-purple-500' },
            { label: 'Admins', value: stats.adminUsers, icon: Shield, color: 'bg-red-500' },
          ].map((stat, idx) => (
            <Card key={idx} className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className={cn('p-2 rounded-lg w-fit mb-3', stat.color)}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['auctions', 'users', 'stats'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                'px-6 py-3 rounded-lg font-medium transition-colors',
                activeTab === tab
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {activeTab === 'auctions' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Auction</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Seller</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Ends</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {auctions.map((auction) => (
                    <tr key={auction.id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-white">{auction.title}</p>
                          <p className="text-sm text-slate-400">{auction.brand}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300">{auction.seller?.display_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-emerald-400 font-semibold">
                          {formatCurrency(auction.current_price)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            auction.status === 'active' ? 'success' :
                            auction.status === 'closed' ? 'info' :
                            auction.status === 'cancelled' ? 'danger' :
                            'default'
                          }
                        >
                          {auction.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300">{formatRelativeTime(auction.end_time)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewBids(auction)}
                            className="text-slate-400 hover:bg-slate-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {auction.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(auction.id, 'cancelled')}
                              className="text-red-400 hover:bg-red-500/20"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                          {auction.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(auction.id, 'active')}
                              className="text-emerald-400 hover:bg-emerald-500/20"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Created</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <p className="font-medium text-white">{user.display_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300">{formatDateTime(user.created_at)}</p>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_admin ? (
                          <Badge variant="warning">Admin</Badge>
                        ) : (
                          <Badge variant="default">User</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Platform Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-700 border-slate-600">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Auction Status Breakdown</h3>
                    {[
                      { label: 'Active', value: stats.activeAuctions, color: 'bg-emerald-500' },
                      { label: 'Closed', value: stats.closedAuctions, color: 'bg-blue-500' },
                      { label: 'Draft', value: auctions.filter((a) => a.status === 'draft').length, color: 'bg-slate-500' },
                      { label: 'Cancelled', value: auctions.filter((a) => a.status === 'cancelled').length, color: 'bg-red-500' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-3 h-3 rounded-full', item.color)} />
                          <span className="text-slate-300">{item.label}</span>
                        </div>
                        <span className="font-semibold text-white">{item.value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Bids Modal */}
        <Modal
          isOpen={bidsModalOpen}
          onClose={() => setBidsModalOpen(false)}
          title={`Bids for: ${selectedAuction?.title}`}
          size="lg"
        >
          {actionLoading && <LoadingOverlay />}
          <div className="space-y-4">
            {selectedBids.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No bids yet</p>
            ) : (
              selectedBids.map((bid, idx) => (
                <div
                  key={bid.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg',
                    bid.is_winning ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50'
                  )}
                >
                  <div>
                    <p className={cn(
                      'font-semibold text-lg',
                      bid.is_winning ? 'text-emerald-700' : 'text-slate-900'
                    )}>
                      {formatCurrency(bid.amount)}
                    </p>
                    <p className="text-sm text-slate-500">{formatDateTime(bid.created_at)}</p>
                  </div>
                  {selectedAuction?.status === 'active' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleSelectWinner(selectedAuction.id, bid.bidder_id)}
                    >
                      Select as Winner
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
