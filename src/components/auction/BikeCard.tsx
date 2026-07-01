import { Clock, ArrowUp, User, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BikeWithDetails } from '../../types/database';
import { formatCurrency, formatTimeRemaining, getTimerColor, getStatusColor } from '../../lib/utils';
import { useCountdown } from '../../hooks/useCountdown';
import { Badge } from '../ui/Badge';
import { BIKE_IMAGES } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface BikeCardProps {
  bike: BikeWithDetails;
}

export function BikeCard({ bike }: BikeCardProps) {
  const { seconds } = useCountdown(bike.end_time);
  const isEnded = seconds <= 0;

  const displayImage = bike.image_urls?.[0] || BIKE_IMAGES[Math.floor(Math.random() * BIKE_IMAGES.length)];

  return (
    <Link to={`/auction/${bike.id}`}>
      <div className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <img
            src={displayImage}
            alt={bike.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <Badge
              variant={bike.status === 'active' ? 'success' : bike.status === 'closed' ? 'info' : 'default'}
              size="sm"
            >
              {bike.status.charAt(0).toUpperCase() + bike.status.slice(1)}
            </Badge>
          </div>
          {/* Timer Badge */}
          {bike.status === 'active' && (
            <div className="absolute top-3 right-3">
              <div className={cn(
                'px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm flex items-center gap-1.5',
                getTimerColor(bike.end_time)
              )}>
                <Clock className="w-3.5 h-3.5" />
                {isEnded ? 'Ended' : formatTimeRemaining(bike.end_time)}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          {bike.category && (
            <p className="text-xs font-medium text-emerald-600 mb-1">{bike.category.name}</p>
          )}

          {/* Title */}
          <h3 className="font-semibold text-slate-900 text-lg line-clamp-1 mb-1">{bike.title}</h3>

          {/* Brand and Model */}
          <p className="text-sm text-slate-500 mb-3">
            {bike.brand}
            {bike.model && ` - ${bike.model}`}
            {bike.year && ` (${bike.year})`}
          </p>

          {/* Price Info */}
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs text-slate-500 mb-1">Current Bid</p>
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(bike.current_price, bike.currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 mb-1">Started at</p>
              <p className="text-sm text-slate-600">
                {formatCurrency(bike.starting_price, bike.currency)}
              </p>
            </div>
          </div>

          {/* Seller */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
              {bike.seller?.avatar_url ? (
                <img src={bike.seller.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
            <span className="text-sm text-slate-600 truncate">
              {bike.seller?.display_name || 'Anonymous'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
