import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Bike, BikeWithDetails, Bid, Category } from '../types/database';

export function useBikes(filters?: {
  status?: Bike['status'];
  categoryId?: string;
  sellerId?: string;
  searchQuery?: string;
}) {
  const [bikes, setBikes] = useState<BikeWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBikes = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('bikes')
      .select(`
        *,
        category:categories!category_id (id, name, description, created_at),
        seller:profiles!seller_id (id, display_name, avatar_url),
        winner:profiles!winner_id (id, display_name, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters?.sellerId) {
      query = query.eq('seller_id', filters.sellerId);
    }
    if (filters?.searchQuery) {
      query = query.or(`title.ilike.%${filters.searchQuery}%,brand.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setBikes([]);
    } else {
      setBikes((data || []) as unknown as BikeWithDetails[]);
    }
    setLoading(false);
  }, [filters?.status, filters?.categoryId, filters?.sellerId, filters?.searchQuery]);

  useEffect(() => {
    fetchBikes();
  }, [fetchBikes]);

  return { bikes, loading, error, refetch: fetchBikes };
}

export function useBike(id: string) {
  const [bike, setBike] = useState<BikeWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBike = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('bikes')
      .select(`
        *,
        category:categories!category_id (id, name, description, created_at),
        seller:profiles!seller_id (id, display_name, avatar_url),
        winner:profiles!winner_id (id, display_name, avatar_url)
      `)
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      setBike(null);
    } else {
      setBike(data as unknown as BikeWithDetails);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchBike();
  }, [fetchBike]);

  return { bike, loading, error, refetch: fetchBike };
}

export function useBids(bikeId: string) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBids = useCallback(async () => {
    if (!bikeId) return;

    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('bids')
      .select('*')
      .eq('bike_id', bikeId)
      .order('amount', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      setBids([]);
    } else {
      setBids(data || []);
    }
    setLoading(false);
  }, [bikeId]);

  useEffect(() => {
    fetchBids();

    // Subscribe to new bids
    const channel = supabase
      .channel(`bids:${bikeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `bike_id=eq.${bikeId}`,
        },
        () => {
          fetchBids();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bikeId, fetchBids]);

  return { bids, loading, error, refetch: fetchBids };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (fetchError) {
        setError(fetchError.message);
        setCategories([]);
      } else {
        setCategories(data || []);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}

export function usePlaceBid() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeBid = async (bikeId: string, amount: number, bidderId: string) => {
    setLoading(true);
    setError(null);

    // Start a transaction by placing the bid and updating the current price
    const { error: bidError } = await supabase
      .from('bids')
      .insert({
        bike_id: bikeId,
        amount,
        bidder_id: bidderId,
        is_winning: true,
      });

    if (bidError) {
      setError(bidError.message);
      setLoading(false);
      return { success: false, error: bidError.message };
    }

    // Update the bike's current price
    const { error: updateError } = await supabase
      .from('bikes')
      .update({ current_price: amount })
      .eq('id', bikeId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return { success: false, error: updateError.message };
    }

    // Mark previous winning bids as not winning
    await supabase
      .from('bids')
      .update({ is_winning: false })
      .eq('bike_id', bikeId)
      .neq('bidder_id', bidderId)
      .eq('is_winning', true);

    setLoading(false);
    return { success: true };
  };

  return { placeBid, loading, error };
}
