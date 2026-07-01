import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Calendar, DollarSign, Package, AlertCircle, Plus, X, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useCategories } from '../hooks/useBikes';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { LoadingOverlay } from '../components/ui/Loading';
import { BIKE_IMAGES, formatCurrency } from '../lib/utils';
import toast from 'react-hot-toast';

export function CreateAuctionPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { categories } = useCategories();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    brand: '',
    model: '',
    year: '',
    categoryId: '',
    startingPrice: '',
    buyNowPrice: '',
    reservePrice: '',
    duration: '7',
    imageUrls: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.startingPrice || parseFloat(formData.startingPrice) <= 0) {
      newErrors.startingPrice = 'Valid starting price is required';
    }
    if (!formData.duration || parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Duration is required';
    }
    if (formData.buyNowPrice && parseFloat(formData.buyNowPrice) <= parseFloat(formData.startingPrice || '0')) {
      newErrors.buyNowPrice = 'Buy now price must be higher than starting price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    const startTime = new Date();
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + parseInt(formData.duration));

    const bikeData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      brand: formData.brand.trim(),
      model: formData.model.trim() || null,
      year: formData.year ? parseInt(formData.year) : null,
      category_id: formData.categoryId || null,
      starting_price: parseFloat(formData.startingPrice),
      current_price: parseFloat(formData.startingPrice),
      buy_now_price: formData.buyNowPrice ? parseFloat(formData.buyNowPrice) : null,
      reserve_price: formData.reservePrice ? parseFloat(formData.reservePrice) : null,
      end_time: endTime.toISOString(),
      status: isDraft ? 'draft' : 'active',
      image_urls: formData.imageUrls.length > 0 ? formData.imageUrls : [BIKE_IMAGES[0]],
    };

    const { error } = await supabase.from('bikes').insert(bikeData);

    if (error) {
      if (error.message.includes('RLS')) {
        toast.error('Please sign in to create an auction');
        navigate('/login');
      } else {
        toast.error(error.message);
      }
      setLoading(false);
      return;
    }

    toast.success(isDraft ? 'Draft saved!' : 'Auction created successfully!');
    navigate('/dashboard');
  };

  const addImageUrl = () => {
    const url = prompt('Enter image URL:');
    if (url && url.trim()) {
      setFormData({
        ...formData,
        imageUrls: [...formData.imageUrls, url.trim()],
      });
    }
  };

  const removeImageUrl = (index: number) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
  };

  const durations = [
    { value: '1', label: '1 Day' },
    { value: '3', label: '3 Days' },
    { value: '7', label: '7 Days' },
    { value: '10', label: '10 Days' },
    { value: '14', label: '14 Days' },
    { value: '30', label: '30 Days' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  }));

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Create New Auction</h1>
          <p className="text-slate-600 mt-2">List your bike for auction and let bidders compete for it.</p>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <Input
                label="Auction Title *"
                placeholder="e.g., Royal Enfield Classic 350 (2023)"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={errors.title}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Brand *"
                  placeholder="e.g., Royal Enfield, KTM, Yamaha"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  error={errors.brand}
                />

                <Input
                  label="Model"
                  placeholder="e.g., Classic 350, Duke 390, R15 V4"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="Category"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  placeholder="Select category"
                />

                <Select
                  label="Year"
                  options={years}
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  placeholder="Select year"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your motorcycle's condition, mileage, service history, modifications, accessories, and any known issues."
                  rows={5}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1.5">{errors.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-900">Images</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 flex-wrap">
                {formData.imageUrls.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`Bike ${idx + 1}`}
                      className="w-24 h-24 rounded-lg object-cover border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImageUrl(idx)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-colors"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-xs mt-1">Add URL</span>
                </button>
              </div>
              <p className="text-sm text-slate-500">
                Add image URLs from hosting services like Imgur, Flickr, etc.
                A default image will be used if none are provided.
              </p>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-900">Pricing</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Starting Price (Rs.) *"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g., 500"
                  value={formData.startingPrice}
                  onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                  error={errors.startingPrice}
                  helperText="The opening bid amount"
                />

                <Input
                  label="Buy Now Price (Rs.)"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Optional"
                  value={formData.buyNowPrice}
                  onChange={(e) => setFormData({ ...formData, buyNowPrice: e.target.value })}
                  error={errors.buyNowPrice}
                  helperText="Optionally set a buy price"
                />
              </div>

              <Input
                label="Reserve Price (Rs.)"
                type="number"
                min="1"
                step="1"
                placeholder="Optional"
                value={formData.reservePrice}
                onChange={(e) => setFormData({ ...formData, reservePrice: e.target.value })}
                helperText="Minimum price you'll accept (not shown to bidders)"
              />
            </CardContent>
          </Card>

          {/* Duration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-900">Duration</h2>
              </div>
            </CardHeader>
            <CardContent>
              <Select
                label="Auction Length *"
                options={durations}
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="Select duration"
              />
              {errors.duration && (
                <p className="text-sm text-red-600 mt-1.5">{errors.duration}</p>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-slate-100 border border-slate-200">
            <CardContent className="py-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-600">Starting auction at</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(parseFloat(formData.startingPrice || '0') || 0)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Duration</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formData.duration || '7'} days
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={(e) => handleSubmit(e as React.FormEvent, true)}
              loading={loading}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              loading={loading}
            >
              Publish Auction
            </Button>
          </div>
        </form>

        {loading && <LoadingOverlay message="Creating auction..." />}
      </div>
    </div>
  );
}
