
import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, RotateCw } from 'lucide-react';

// Multiple keys for fallback/redundancy
const GIPHY_KEYS = [
  '0UTRbFtkMxAplrog67DDmUH54pA', 
  'pLURtkhVrUXr3KG25Gy5JJAfhz5406mW', 
  'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh'
];

interface GiphyImage {
  id: string;
  images: {
    fixed_height: { url: string };
    original: { url: string };
  };
  title: string;
}

export const GiphyPicker: React.FC<{ onClose: () => void; onSelect: (url: string) => void }> = ({ onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GiphyImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<GiphyImage[]>([]);
  const [giphyError, setGiphyError] = useState<string | null>(null);

  const fetchGifs = async (searchTerm: string) => {
    setLoading(true);
    setGiphyError(null);
    let success = false;

    // Try keys sequentially until one works
    for (const key of GIPHY_KEYS) {
      try {
        const encoded = encodeURIComponent(searchTerm);
        const endpoint = searchTerm 
          ? `https://api.giphy.com/v1/gifs/search?api_key=${key}&q=${encoded}&limit=20&rating=g`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${key}&limit=20&rating=g`;
        
        const res = await fetch(endpoint);
        if (!res.ok) continue; // Try next key if HTTP error

        const data = await res.json();
        const gifs = Array.isArray(data.data) ? data.data : [];
        
        if (searchTerm) {
          setResults(gifs);
        } else {
          setTrending(gifs);
        }
        success = true;
        break; // Exit loop on success
      } catch (e) {
        console.warn(`Giphy key ${key} failed.`, e);
      }
    }

    if (!success) {
      if (searchTerm) setResults([]);
      else setTrending([]);
      setGiphyError("The archives are currently unreachable (Rate Limit).");
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchGifs('');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGifs(query);
  };

  const displayGifs = (query ? results : trending) || [];

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-theme-panel border border-theme-gold shadow-[0_0_50px_rgba(212,175,55,0.2)] flex flex-col h-[600px] relative">
        {/* Header */}
        <div className="p-4 border-b border-theme-border flex justify-between items-center bg-theme-bg">
          <h3 className="text-theme-gold royal-font font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="text-xl">🎞️</span> Giphy Portal
          </h3>
          <button onClick={onClose} className="text-theme-text-dim hover:text-theme-gold transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 bg-theme-panel">
          <form onSubmit={handleSearch} className="relative group">
             <input 
               autoFocus
               type="text" 
               placeholder="Search the archives (e.g., 'Cyberpunk', 'Retro', 'Glitch')..." 
               className="w-full bg-theme-bg border border-theme-border p-4 pl-12 text-theme-text font-medium focus:outline-none focus:border-theme-gold transition-all placeholder-theme-border royal-font"
               value={query}
               onChange={(e) => setQuery(e.target.value)}
             />
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-dim group-focus-within:text-theme-gold transition-colors" size={20} />
             <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-gold text-xs font-bold uppercase tracking-widest hover:text-white">
               Search
             </button>
          </form>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-theme-bg mandala-bg">
          {loading ? (
             <div className="h-full flex items-center justify-center flex-col gap-4 text-theme-text-muted">
               <Loader2 className="animate-spin w-10 h-10 text-theme-gold" />
               <span className="text-xs font-bold uppercase tracking-widest">Summoning Visuals...</span>
             </div>
          ) : giphyError ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
               <div className="text-red-500 font-bold uppercase tracking-widest text-xs royal-font">Connection Severed</div>
               <div className="text-theme-text-muted text-[10px] font-mono">{giphyError}</div>
               <button 
                 onClick={() => fetchGifs(query)}
                 className="flex items-center gap-2 px-6 py-2 border border-theme-border hover:bg-white/5 hover:text-theme-gold text-theme-text-muted text-xs font-bold uppercase tracking-widest transition-all royal-font"
               >
                 <RotateCw size={14} /> Retry
               </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {displayGifs.map((gif) => (
                <button 
                  key={gif.id}
                  onClick={() => onSelect(gif.images.original.url)}
                  className="relative group aspect-square overflow-hidden border border-theme-border hover:border-theme-gold transition-all bg-theme-panel"
                >
                  <img 
                    src={gif.images.fixed_height.url} 
                    alt={gif.title} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-theme-gold font-bold text-xs uppercase tracking-widest border border-theme-gold px-3 py-1 bg-black/80">Select</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {!loading && !giphyError && displayGifs.length === 0 && (
             <div className="text-center mt-20 opacity-50 text-theme-text-muted font-serif italic">
               No records found in the archives.
             </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-2 border-t border-theme-border bg-theme-bg text-center">
          <img src="https://developers.giphy.com/branch/master/static/header-logo-0fec0225d189bc0eae27dac3e3770582.gif" className="h-6 mx-auto opacity-50 grayscale hover:grayscale-0 transition-all" alt="Powered by Giphy" />
        </div>
      </div>
    </div>
  );
};
