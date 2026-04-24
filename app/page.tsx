"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  ShieldCheck, ChevronRight, User, Globe, X, Scale, FileText, Mail, Phone,
  Sparkles, TrendingUp, Star, Zap, ArrowRight, Menu, Car, Search as SearchIcon,
  Package, MapPin   // <-- add these
} from 'lucide-react';

const carBrands = [
  "ALFA ROMEO", "AUDI", "BMW", "CHEVROLET", "CITROEN", "DACIA", "FIAT", "FORD",
  "HONDA", "HYUNDAI", "JAGUAR", "JEEP", "KIA", "LAND ROVER", "MAZDA",
  "MERCEDES-BENZ", "MITSUBISHI", "NISSAN", "OPEL", "PEUGEOT", "PORSCHE",
  "RENAULT", "SEAT", "SKODA", "SMART", "SUBARU", "SUZUKI", "TOYOTA", "VOLVO", "VW"
];

export default function LandingPage() {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [partType, setPartType] = useState('');
  const [featuredParts, setFeaturedParts] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    const fetchFeaturedParts = async () => {
      const { data } = await supabase
        .from('parts')
        .select('*, users!seller_id(name, city)')
        .eq('status', 'Active')
        .order('created_at', { ascending: false })
        .limit(6);
      if (data) setFeaturedParts(data);
      setLoadingFeatured(false);
    };
    fetchFeaturedParts();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (brand) params.append('brand', brand);
    if (model) params.append('model', model);
    if (partType) params.append('partType', partType);
    router.push(`/search?${params.toString()}`);
    setIsSearchOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-600/30 font-sans antialiased overflow-x-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Search Overlay – same but smoother */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl p-6 md:p-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button onClick={() => setIsSearchOpen(false)} className="absolute top-10 right-10 p-4 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-8 h-8 text-white" />
          </button>
          <div className="max-w-4xl mx-auto space-y-12 mt-20">
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider">
                <SearchIcon size={12} /> Kërkim i Avancuar
              </div>
              <h3 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">
                Çfarë pjese ju duhet?
              </h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 text-white">Marka</label>
                <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full bg-zinc-900 border border-white/10 p-5 rounded-2xl font-bold uppercase italic text-white focus:border-blue-600 outline-none transition-all">
                  <option value="">Zgjidh Markën</option>
                  {carBrands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 text-white">Modeli</label>
                <input type="text" placeholder="Psh: C-Class..." value={model} onChange={(e) => setModel(e.target.value)} className="w-full bg-zinc-900 border border-white/10 p-5 rounded-2xl font-bold uppercase italic text-white focus:border-blue-600 outline-none placeholder:opacity-20 transition-all" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 text-white">Lloji i Pjesës</label>
                <input type="text" placeholder="Psh: Motor..." value={partType} onChange={(e) => setPartType(e.target.value)} className="w-full bg-zinc-900 border border-white/10 p-5 rounded-2xl font-bold uppercase italic text-white focus:border-blue-600 outline-none placeholder:opacity-20 transition-all" />
              </div>
            </div>
            <button onClick={handleSearch} className="w-full bg-white text-black py-8 rounded-4xl font-black uppercase italic tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all text-xl shadow-2xl shadow-blue-600/20 group">
              Shfaq Rezultatet
              <ArrowRight className="inline ml-4 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <nav className="fixed top-0 w-full z-40 bg-black/90 backdrop-blur-md border-b border-white/5 px-6 py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-black italic tracking-tighter uppercase text-white flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-500" />
            AUTO PJESË
          </div>
          <div className="flex items-center gap-4">
            <button className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-2 rounded-full hover:bg-white/10 transition-colors">
              <Globe className="w-3 h-3" /> AL
            </button>
            <button onClick={() => router.push('/login')} className="p-2 hover:bg-white/5 rounded-full transition-colors border border-white/10">
              <User className="w-5 h-5 text-zinc-400" />
            </button>
            <button onClick={() => router.push('/signup')} className="hidden sm:block text-[10px] font-black uppercase tracking-widest bg-blue-600 px-4 py-2 rounded-full hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">
              Regjistrohu
            </button>
          </div>
        </div>
      </nav>

      {/* Sliding Brands – same */}
      <div className="relative w-full overflow-hidden bg-zinc-900/50 border-b border-white/5 py-5 mt-24">
        <div className="animate-marquee whitespace-nowrap flex items-center">
          {carBrands.map((b, i) => (
            <span key={i} className="mx-14 text-[11px] font-black tracking-[0.5em] opacity-25 hover:opacity-100 transition-opacity cursor-default uppercase italic">{b}</span>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative px-6 pt-24 pb-32 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-10">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-[10px] font-bold tracking-[0.2em] uppercase text-blue-400 animate-pulse">
            <ShieldCheck className="w-4 h-4" /> Platformë e Verifikuar në Shqipëri
          </div>
          <h1 className="text-7xl md:text-9xl font-black italic leading-[0.8] tracking-tighter uppercase text-white">
            Gjej<br />pjesën që<br />të duhet.
          </h1>
          <p className="text-xl text-zinc-400 max-w-md font-medium leading-relaxed italic opacity-80">
            Rrjeti më i madh i pjesëve të këmbimit origjinale, direkt nga pikat e autorizuara të skrapit.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => setIsSearchOpen(true)} className="group relative flex items-center gap-5 bg-white text-black px-12 py-6 rounded-full font-black uppercase italic tracking-widest hover:bg-blue-600 hover:text-white transition-all duration-500 shadow-xl shadow-blue-600/10">
              Kërko në Inventar
              <ChevronRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </button>
            <button onClick={() => router.push('/search')} className="border border-white/20 px-8 py-6 rounded-full font-black uppercase italic text-[10px] tracking-widest hover:bg-white/5 transition-all">
              Shfleto të Gjitha
            </button>
          </div>
        </div>

        {/* Floating Card – improved */}
        <div className="relative group lg:block hidden">
          <div className="absolute -inset-2 bg-linear-to-r from-blue-600/20 to-cyan-500/20 rounded-4xl blur-2xl group-hover:blur-3xl transition-all duration-700"></div>
          <div className="relative animate-float aspect-4/5 rounded-[2.5rem] border border-white/10 bg-zinc-950/80 backdrop-blur-xl overflow-hidden flex flex-col p-12 shadow-2xl">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[11px] font-black tracking-[0.3em] opacity-40 italic uppercase text-blue-400 block">ID: PJESË #003</span>
                <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest text-white">Modeli: 2024 Series</span>
              </div>
              <div className="px-5 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest bg-zinc-900 shadow-inner text-white">
                Autopjesë Albania
              </div>
            </div>
            <div className="mt-auto border-t border-white/5 pt-8">
              <div className="text-9xl font-black italic opacity-5 select-none tracking-tighter uppercase leading-none text-white">AUTO</div>
              <p className="text-[10px] font-bold tracking-[0.5em] opacity-20 uppercase mt-4 text-white">Kualitet i Garantuar</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Parts Section */}
      <section className="px-6 pb-32 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">Pjesët më të reja</h2>
            <p className="text-zinc-500 text-sm mt-2">Zbuloni artikujt e fundit të shtuar nga shitësit tanë.</p>
          </div>
          <button onClick={() => router.push('/search')} className="hidden md:flex items-center gap-2 text-blue-500 text-sm font-black uppercase italic tracking-wider hover:gap-3 transition-all">
            Shiko të gjitha <ArrowRight size={16} />
          </button>
        </div>
        {loadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-zinc-900/50 rounded-3xl h-96 animate-pulse"></div>
            ))}
          </div>
        ) : featuredParts.length === 0 ? (
          <div className="text-center py-20 border border-white/5 rounded-3xl bg-zinc-900/20">
            <Package size={48} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-500">Nuk ka pjesë të reja për momentin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredParts.map((part) => (
              <div key={part.id} className="group bg-zinc-900/40 border border-white/5 rounded-3xl overflow-hidden hover:border-blue-600/30 transition-all hover:scale-[1.02] duration-300">
                <div className="aspect-square bg-zinc-800 relative overflow-hidden">
                  {part.image_url ? (
                    <img src={part.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={part.title} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      <Package size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-2xl font-black italic text-sm shadow-lg">
                    {part.price}€
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-black italic uppercase tracking-tight">{part.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{part.model} • {part.year}</p>
                  <div className="flex items-center gap-2 mt-4 text-[10px] text-zinc-400">
                    <MapPin size={12} /> {part.users?.city || 'Shqipëri'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stats Section */}
      <section className="px-6 py-20 bg-linear-to-b from-black to-zinc-950 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <div className="text-5xl font-black italic text-blue-500">150+</div>
            <p className="text-xs font-black uppercase tracking-widest mt-2 text-zinc-500">Shitës Aktivë</p>
          </div>
          <div>
            <div className="text-5xl font-black italic text-blue-500">3,500+</div>
            <p className="text-xs font-black uppercase tracking-widest mt-2 text-zinc-500">Pjesë të Listuara</p>
          </div>
          <div>
            <div className="text-5xl font-black italic text-blue-500">98%</div>
            <p className="text-xs font-black uppercase tracking-widest mt-2 text-zinc-500">Kënaqësi e Klientëve</p>
          </div>
        </div>
      </section>

      {/* Footer – same but slightly polished */}
      <footer className="bg-zinc-950 border-t border-white/5 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
            <div className="md:col-span-6 space-y-6">
              <div className="text-2xl font-black italic tracking-tighter text-white uppercase flex items-center gap-2">
                <Car className="w-6 h-6 text-blue-500" />
                AUTO PJESË
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-sm italic">
                Zgjidhja juaj për pjesë këmbimi origjinale. Ne lidhim kërkesën tuaj me pikat më të mira të skrapit në vend.
              </p>
            </div>
            <div className="md:col-span-3 space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Legjislacioni</h4>
              <ul className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                <li><a href="/kushtet" className="flex items-center gap-3 hover:text-white transition-colors"><Scale className="w-4 h-4" /> Kushtet e Përdorimit</a></li>
                <li><a href="/privatesia" className="flex items-center gap-3 hover:text-white transition-colors"><FileText className="w-4 h-4" /> Politika e Privatësisë</a></li>
              </ul>
            </div>
            <div className="md:col-span-3 space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Kontakt</h4>
              <ul className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                <li><a href="https://wa.me/355600000000" target="_blank" className="flex items-center gap-3 hover:text-green-500 transition-colors"><Phone className="w-4 h-4" /> +355 6X XXX XXXX</a></li>
                <li><a href="mailto:info@enklan.al" className="flex items-center gap-3 hover:text-blue-500 transition-colors lowercase"><Mail className="w-4 h-4" /> info@enklan.al</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-10">
            <div className="flex flex-col md:flex-row justify-between gap-8 text-[10px] font-medium text-zinc-500 italic leading-relaxed">
              <div className="max-w-2xl uppercase text-zinc-500">
                <p className="font-black mb-2 text-zinc-400 tracking-widest underline decoration-blue-600 underline-offset-4">Deklaratë Ligjore:</p>
                AUTO PJESË nuk mban përgjegjësi për gjendjen teknike, cilësinë apo çmimet e produkteve të shpërndara nga pikat e autorizuara të skrapit.
              </div>
              <div className="md:text-right flex flex-col justify-end">
                <div className="font-black tracking-[0.3em] text-white uppercase mb-1">© 2026 Të gjitha të drejtat e rezervuara</div>
                <div className="font-black tracking-[0.3em] opacity-40 uppercase">ENKLAN SH.P.K</div>
                <div className="text-[9px] mt-2 opacity-20 uppercase tracking-[0.2em]">MADE IN ALBANIA</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}