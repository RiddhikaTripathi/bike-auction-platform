import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  ArrowUp,
  User,
  Package,
  AlertCircle,
  Calendar,
  Tag,
  Shield,
  Gavel,
  History,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { useBike, useBids, usePlaceBid } from '../../hooks/useBikes';
import { useAuth } from '../../hooks/useAuth';
import { useCountdown } from '../../hooks/useCountdown';
import { formatCurrency, formatTimeRemaining, formatDateTime, getTimerColor, cn, BIKE_IMAGES } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { LoadingSpinner, LoadingOverlay } from '../ui/Loading';
import toast from 'react-hot-toast';
import type { Bike } from '../../types/database';

export function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const { bike, loading: bikeLoading, error: bikeError, refetch } = useBike(id!);
  const { bids, loading: bidsLoading } = useBids(id!);
  const { placeBid, loading: biddingLoading } = usePlaceBid();

  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  const { seconds, isEnded, refresh } = useCountdown(bike?.end_time || Date.now());

  // Subscribe to updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  if (bikeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (bikeError || !bike) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Auction Not Found</h2>
          <p className="text-slate-600 mb-6">This auction may have been removed or doesn't exist.</p>
          <Link to="/">
            <Button variant="primary">Browse Auctions</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = bike.image_urls?.length > 0 ? bike.image_urls : [BIKE_IMAGES[0]];
  const displayImage = images[selectedImage] || images[0];
  const minBid = bike.current_price + 1;

  const isSeller = user?.id === bike.seller_id;
  const canBid = !isSeller && bike.status === 'active' && !isEnded && user;

  const handlePlaceBid = async () => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount < minBid) {
      toast.error(`Minimum bid is ${formatCurrency(minBid, bike.currency)}`);
      return;
    }

    const result = await placeBid(bike.id, amount, user!.id);
    if (result.success) {
      toast.success('Bid placed successfully!');
      setShowBidModal(false);
      setBidAmount('');
      refetch();
    } else {
      toast.error(result.error || 'Failed to place bid');
    }
  };

  const quickBidAmounts = [minBid, minBid + 50, minBid + 100, minBid + 500];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link to="/" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
            Browse
          </Link>
          <span className="mx-2 text-slate-400">/</span>
          <span className="text-slate-600 text-sm">{bike.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
              <img
                src={displayImage}
                alt={bike.title}
                className="w-full h-full object-cover"
              />
              {bike.status === 'active' && (
                <div className="absolute top-4 right-4">
                  <div className={cn(
                    'px-3 py-2 rounded-full text-sm font-semibold bg-white/95 backdrop-blur-sm flex items-center gap-2 shadow-lg',
                    getTimerColor(bike.end_time)
                  )}>
                    <Clock className="w-4 h-4" />
                    {isEnded ? 'Ended' : formatTimeRemaining(bike.end_time)}
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={cn(
                      'w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                      selectedImage === idx
                        ? 'border-emerald-500 shadow-md'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge variant={bike.status === 'active' ? 'success' : 'info'}>
                  {bike.status.charAt(0).toUpperCase() + bike.status.slice(1)}
                </Badge>
                {bike.category && (
                  <Badge variant="default">{bike.category.name}</Badge>
                )}
              </div>

              <h1 className="text-3xl font-bold text-slate-900 mb-2">{bike.title}</h1>
              <p className="text-lg text-slate-600">
                {bike.brand}
                {bike.model && ` - ${bike.model}`}
                {bike.year && ` (${bike.year})`}
              </p>
            </div>

            {/* Price Card */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Current Highest Bid</p>
                    <p className="text-3xl font-bold text-emerald-400">
                      {formatCurrency(bike.current_price, bike.currency)}
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                      Started at {formatCurrency(bike.starting_price, bike.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-sm mb-1">Auction Ends</p>
                    <p className="text-lg font-semibold">{formatDateTime(bike.end_time)}</p>
                    {bike.buy_now_price && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="mt-4"
                        disabled={true} // TODO: Implement buy now
                      >
                        Buy Now: {formatCurrency(bike.buy_now_price, bike.currency)}
                      </Button>
                    )}
                  </div>
                </div>

                {canBid && (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full mt-6 py-4 text-lg"
                    onClick={() => setShowBidModal(true)}
                  >
                    <Gavel className="w-5 h-5" />
                    Place Bid
                  </Button>
                )}

                {!user && bike.status === 'active' && !isEnded && (
                  <Link to="/login" className="block">
                    <Button variant="secondary" size="lg" className="w-full mt-6 py-4">
                      Sign in to Bid
                    </Button>
                  </Link>
                )}

                {isSeller && (
                  <p className="text-center text-slate-400 mt-4">
                    You are the seller of this auction
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-900">Description</h2>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 whitespace-pre-wrap">{bike.description}</p>
              </CardContent>
            </Card>

            {/* Seller Info */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-slate-900">Seller</h2>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                    {bike.seller?.avatar_url ? (
                      <img
                        src={bike.seller.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {bike.seller?.display_name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Member since {formatDateTime(bike.seller?.display_name ? new Date().toISOString() : new Date().toISOString()).split(',')[0]}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Winner Info */}
            {bike.status === 'closed' && bike.winner_id && bike.winner && (
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-800">Auction Won By:</p>
                      <p className="text-emerald-600">{bike.winner.display_name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Bid History */}
        <div className="mt-12">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <History className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-semibold text-slate-900">Bid History</h2>
              <span className="ml-auto text-sm text-slate-500">{bids.length} bids</span>
            </CardHeader>
            <CardContent>
              {bidsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : bids.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No bids yet. Be the first!</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {bids.map((bid, idx) => (
                    <div
                      key={bid.id}
                      className={cn(
                        'flex items-center justify-between py-4',
                        bid.is_winning && 'bg-emerald-50 -mx-4 px-4 rounded-lg'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          bid.is_winning ? 'bg-emerald-100' : 'bg-slate-100'
                        )}>
                          {idx === 0 ? (
                            <Gavel className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <span className="text-sm text-slate-600">#{idx + 1}</span>
                          )}
                        </div>
                        <div>
                          <p className={cn(
                            'font-semibold',
                            bid.is_winning ? 'text-emerald-700' : 'text-slate-900'
                          )}>
                            {formatCurrency(bid.amount, bid.currency)}
                          </p>
                          <p className="text-sm text-slate-500">
                            {formatDateTime(bid.created_at)}
                          </p>
                        </div>
                      </div>
                      {bid.is_winning && (
                        <Badge variant="success" size="sm">
                          Highest
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bid Modal */}
        <Modal
          isOpen={showBidModal}
          onClose={() => setShowBidModal(false)}
          title="Place Your Bid"
          size="md"
        >
          {biddingLoading && <LoadingOverlay message="Processing your bid..." />}
          <div className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-700">
                Current highest bid: <span className="font-bold">{formatCurrency(bike.current_price, bike.currency)}</span>
              </p>
              <p className="text-sm text-emerald-600 mt-1">
                Minimum bid: <span className="font-bold">{formatCurrency(minBid, bike.currency)}</span>
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {quickBidAmounts.slice(0, 4).map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setBidAmount(amount.toString())}
                  className={cn(
                    bidAmount === amount.toString() && 'border-emerald-500 bg-emerald-50'
                  )}
                >
                  {formatCurrency(amount, bike.currency)}
                </Button>
              ))}
            </div>

            <Input
              label="Your Bid Amount"
              type="number"
              min={minBid}
              step="1"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={`Minimum: ${formatCurrency(minBid, bike.currency)}`}
              helperText={`Enter at least ${formatCurrency(minBid, bike.currency)}`}
            />

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowBidModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handlePlaceBid}
                disabled={!bidAmount || parseFloat(bidAmount) < minBid}
              >
                Confirm Bid
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
