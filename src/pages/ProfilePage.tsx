import { useState } from 'react';
import { Camera, User, Mail, Edit2, LogOut, Shield, Calendar, Package } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { LoadingOverlay } from '../components/ui/Loading';
import { generateAvatarUrl, formatDateTime } from '../lib/utils';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  const handleSave = async () => {
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim(),
        avatar_url: avatarUrl.trim() || null,
      })
      .eq('id', user!.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated!');
      setIsEditing(false);
    }

    setLoading(false);
  };

  const generatedAvatar = generateAvatarUrl(displayName || 'User');

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Profile Settings</h1>

        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Account Information</h2>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={generatedAvatar}
                        alt={profile?.display_name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 p-2 bg-emerald-600 rounded-full text-white hover:bg-emerald-700 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    {profile?.display_name || 'User'}
                  </h3>
                  <p className="text-slate-500">{user?.email}</p>
                  {profile?.is_admin && (
                    <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Form */}
              {isEditing && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <Input
                    label="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />

                  <Input
                    label="Avatar URL"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    helperText="Leave empty to use generated avatar"
                  />
                </div>
              )}
            </CardContent>
            {isEditing && (
              <CardFooter className="justify-end gap-3">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button variant="primary" loading={loading} onClick={handleSave}>
                  Save Changes
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Account Stats */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-slate-900">Account Activity</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">Member Since</p>
                  <p className="font-semibold text-slate-900">
                    {formatDateTime(profile?.created_at || new Date().toISOString()).split(',')[0]}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <Package className="w-5 h-5 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500">Total Auctions</p>
                  <p className="font-semibold text-slate-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <h2 className="text-lg font-semibold text-red-900">Sign Out</h2>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">
                Sign out of your account. You can sign back in anytime.
              </p>
              <Button variant="danger" onClick={signOut}>
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>

        {loading && <LoadingOverlay message="Saving..." />}
      </div>
    </div>
  );
}
