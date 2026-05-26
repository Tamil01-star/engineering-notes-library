import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import { Bookmark, Clock, ArrowRight, AlertTriangle } from 'lucide-react';

const FavoritesPage = () => {
  const { user, token, toggleFavorite } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6 relative z-20 min-h-[calc(100vh-200px)] flex flex-col justify-center">
        <div className="glass-panel rounded-2xl p-8 border border-white/5 space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-cyan-400" />
          </div>
          <h2 className="font-montserrat text-xl font-bold text-white">Sign In to View Library</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            You must be signed in with your Gmail credentials to view saved files, download histories, and badges.
          </p>
          <button
            onClick={() => navigate('/login?redirect=favorites')}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Sign In with Gmail</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-10 min-h-[calc(100vh-65px)] pb-24 md:pb-8 relative z-20">
      
      <div>
        <h1 className="font-montserrat text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
          <Bookmark className="h-8 w-8 text-cyan-400" />
          <span>My Personal Library</span>
        </h1>
        <p className="text-sm text-slate-400">
          Your bookmarked summary guides and study history.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <h2 className="font-montserrat text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Bookmark className="h-5 w-5 text-cyan-400" />
              <span>Bookmarked Notes ({profile?.favorites?.length || 0})</span>
            </h2>

            {profile?.favorites && profile.favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {profile.favorites.map((note) => (
                  <BookCard
                    key={note.id || note._id}
                    semester={note.semester}
                    title={note.title}
                    subtitle={note.subject}
                    subjectCode={`UNIT ${note.unitNumber}`}
                    count={note.downloads}
                    rating={note.rating}
                    colorIndex={note.semester - 1}
                    isFavorite={true}
                    onFavoriteToggle={() => {
                      toggleFavorite(note.id || note._id).then(() => {
                        fetch('/api/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } })
                          .then(res => res.json())
                          .then(setProfile);
                      });
                    }}
                    onClick={() => navigate(`/notes/${note.id || note._id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center glass-panel rounded-2xl border border-white/5 space-y-3">
                <p className="text-xs text-slate-500">No bookmarked sheets yet.</p>
                <button
                  onClick={() => navigate('/search')}
                  className="px-4 py-2 rounded-lg bg-slate-800 border border-white/5 text-xs text-cyan-400 font-semibold"
                >
                  Find Notes
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="font-montserrat text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-2">
              <Clock className="h-5 w-5 text-purple-400" />
              <span>Recently Read & Downloaded ({profile?.downloadHistory?.length || 0})</span>
            </h2>

            {profile?.downloadHistory && profile.downloadHistory.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {profile.downloadHistory.map((note) => (
                  <BookCard
                    key={note.id || note._id}
                    semester={note.semester}
                    title={note.title}
                    subtitle={note.subject}
                    subjectCode={`UNIT ${note.unitNumber}`}
                    count={note.downloads}
                    rating={note.rating}
                    colorIndex={note.semester - 1}
                    onClick={() => navigate(`/notes/${note.id || note._id}`)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 italic">No files read yet. Your download logs will appear here.</p>
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default FavoritesPage;
