"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User, UserGarage, SavedPart, BuyerLead, Review, Part } from "@/types";
import { Search, Heart, Clock, Settings, LogOut, Car, Star, Trash2 } from "lucide-react";
import Image from "next/image";

export default function BuyerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"garage" | "wishlist" | "history" | "profile">("garage");
  const [loading, setLoading] = useState(true);

  // States for data
  const [garage, setGarage] = useState<UserGarage[]>([]);
  const [wishlist, setWishlist] = useState<SavedPart[]>([]);
  const [history, setHistory] = useState<BuyerLead[]>([]);
  
  // UI States
  const [toast, setToast] = useState<{message: string, type: "success" | "error"} | null>(null);
  
  // Garage form
  const [newMake, setNewMake] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newYear, setNewYear] = useState("");

  // Review System
  const [reviewLead, setReviewLead] = useState<BuyerLead | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchData();

    // Listen for auth state changes (logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (profileData) {
        if (profileData.user_type !== "Individual") {
          router.push("/dashboard");
          return;
        }
        setProfile(profileData);
      }

      // Fetch Garage
      const { data: garageData } = await supabase.from("user_garage").select("*").eq("user_id", user.id);
      if (garageData) setGarage(garageData);

      // Fetch Wishlist
      const { data: wishlistData } = await supabase.from("saved_parts").select("*, parts(*)").eq("user_id", user.id);
      if (wishlistData) setWishlist(wishlistData as any);

      // Fetch History
      const { data: historyData } = await supabase.from("buyer_leads").select("*, parts(*), users!buyer_leads_seller_id_fkey(*)").eq("buyer_id", user.id).order('created_at', { ascending: false });
      if (historyData) setHistory(historyData as any);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleAddCar = async () => {
    if (!newMake || !newModel || !newYear || !profile) return;
    try {
      const { data, error } = await supabase.from("user_garage").insert({
        user_id: profile.id,
        make: newMake,
        model: newModel,
        year: parseInt(newYear)
      }).select().single();
      if (error) throw error;
      setGarage([...garage, data]);
      setNewMake(""); setNewModel(""); setNewYear("");
      showToast("Makina u shtua me sukses!");
    } catch(err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteCar = async (id: string) => {
    try {
      const { error } = await supabase.from("user_garage").delete().eq("id", id);
      if (error) throw error;
      setGarage(garage.filter(c => c.id !== id));
      showToast("Makina u fshi me sukses!");
    } catch(err: any) {
      showToast(err.message, "error");
    }
  };

  const handleRemoveWishlist = async (id: string) => {
    try {
      const { error } = await supabase.from("saved_parts").delete().eq("id", id);
      if (error) throw error;
      setWishlist(wishlist.filter(w => w.id !== id));
      showToast("Pjesa u hoq nga lista!");
    } catch(err: any) {
      showToast(err.message, "error");
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewLead || !profile) return;
    try {
      const { error } = await supabase.from("reviews").insert({
        reviewer_id: profile.id,
        target_user_id: reviewLead.seller_id,
        rating: reviewRating,
        comment: reviewComment
      });
      if (error) throw error;
      
      // Update the lead to indicate it was reviewed, or simply remove the button by checking if a review exists. 
      // For simplicity, we can just show toast and close modal.
      showToast("Vlerësimi u dërgua me sukses!");
      setReviewLead(null);
      setReviewRating(5);
      setReviewComment("");
    } catch(err: any) {
      showToast(err.message, "error");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Duke ngarkuar...</div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-2xl z-[100] border backdrop-blur-xl transition-all ${
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          <p className="font-bold text-sm">{toast.message}</p>
        </div>
      )}

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase cursor-pointer" onClick={() => router.push("/")}>
              Makinat<span className="text-yellow-500">AL</span>
            </h1>
            <nav className="hidden md:flex items-center gap-6">
              {[
                { id: "garage", label: "Garazhi Im", icon: Car },
                { id: "wishlist", label: "Të Ruajturat", icon: Heart },
                { id: "history", label: "Historiku", icon: Clock },
                { id: "profile", label: "Profili", icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                      activeTab === tab.id
                        ? "bg-white/10 text-white"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-zinc-400">Përshëndetje, {profile?.name}</span>
            <button
              onClick={handleLogout}
              className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        {activeTab === "garage" && (
          <div className="space-y-6 max-w-4xl">
            <h2 className="text-2xl font-black uppercase italic tracking-tight">Garazhi Im</h2>
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-4">Shto Makinë të Re</h3>
              <div className="flex gap-4">
                <input type="text" value={newMake} onChange={e=>setNewMake(e.target.value)} placeholder="Marka (psh. Audi)" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none" />
                <input type="text" value={newModel} onChange={e=>setNewModel(e.target.value)} placeholder="Modeli (psh. A4)" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none" />
                <input type="number" value={newYear} onChange={e=>setNewYear(e.target.value)} placeholder="Viti (psh. 2012)" className="w-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none" />
                <button onClick={handleAddCar} className="bg-yellow-500 text-black px-6 rounded-xl font-bold hover:bg-yellow-400">Shto</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {garage.map(car => (
                <div key={car.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-orange-500 opacity-50" />
                  <div className="flex justify-between items-start mb-4">
                    <Car className="w-8 h-8 text-yellow-500" />
                    <button onClick={() => handleDeleteCar(car.id)} className="text-zinc-500 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5"/></button>
                  </div>
                  <h3 className="text-xl font-black">{car.make} {car.model}</h3>
                  <p className="text-zinc-400 font-medium">{car.year}</p>
                </div>
              ))}
              {garage.length === 0 && (
                <div className="col-span-3 text-center py-12 text-zinc-500 border border-white/5 border-dashed rounded-2xl">
                  Nuk keni asnjë makinë në garazh.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "wishlist" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-pink-500">Të Ruajturat</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {wishlist.map(w => w.parts && (
                <div key={w.id} className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden group">
                  <div className="h-48 bg-zinc-900 relative">
                    <Image src={w.parts.image_url || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2000&auto=format&fit=crop'} alt="Pjesë" fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover" />
                    <button onClick={() => handleRemoveWishlist(w.id)} className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-md rounded-full text-pink-500 hover:bg-pink-500 hover:text-white transition-all">
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg">{w.parts.title}</h3>
                    <p className="text-yellow-500 font-black text-xl">{w.parts.price}€</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase italic tracking-tight">Historiku i Kërkesave</h2>
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <tr>
                    <th className="py-4 px-6">Pjesa</th>
                    <th className="py-4 px-6">Shitësi</th>
                    <th className="py-4 px-6">Data</th>
                    <th className="py-4 px-6">Statusi</th>
                    <th className="py-4 px-6">Vlerësimi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map(h => (
                    <tr key={h.id} className="hover:bg-white/[0.02]">
                      <td className="py-4 px-6 font-bold">{h.parts?.title}</td>
                      <td className="py-4 px-6">{h.users?.name || h.users?.phone}</td>
                      <td className="py-4 px-6 text-zinc-400">{new Date(h.created_at).toLocaleDateString('sq-AL')}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          h.status === 'sold' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500'
                        }`}>
                          {h.status === 'sold' ? 'BLERË' : 'KONTAKTUAR'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {h.status === 'sold' && (
                          <button onClick={() => setReviewLead(h)} className="flex items-center gap-1 text-xs font-bold text-yellow-500 hover:text-yellow-400">
                            <Star className="w-4 h-4" /> Vlerëso
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500">Nuk keni historik kërkesash.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "profile" && profile && (
          <ProfilePanel profile={profile} showToast={showToast} setProfile={setProfile} />
        )}
      </main>

      {/* REVIEW MODAL */}
      {reviewLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/80">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4 text-yellow-500">Lër një Vlerësim</h3>
            <p className="text-xs text-zinc-400 mb-6">Për shitësin e pjesës: <strong className="text-white">{reviewLead.parts?.title}</strong></p>
            
            <div className="flex justify-center gap-2 mb-6">
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => setReviewRating(star)} className="focus:outline-none">
                  <Star className={`w-10 h-10 ${star <= reviewRating ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-700'}`} />
                </button>
              ))}
            </div>

            <textarea 
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              placeholder="Shkruaj një koment (opsionale)"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-yellow-500 outline-none resize-none mb-6 h-32"
            />

            <div className="flex gap-4">
              <button onClick={handleSubmitReview} className="flex-1 bg-yellow-500 text-black py-3 rounded-xl font-black uppercase italic text-sm hover:bg-yellow-400 transition-all">Dërgo</button>
              <button onClick={() => setReviewLead(null)} className="px-6 bg-white/5 py-3 rounded-xl font-black uppercase italic text-sm hover:bg-white/10 transition-all">Anulo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfilePanel({ profile, showToast, setProfile }: { profile: User, showToast: (msg: string, type?: "success" | "error") => void, setProfile: (profile: User) => void }) {
  const [form, setForm] = useState({
    name: profile.name || "",
    email: profile.email || "",
    phone: profile.phone || "",
    city: profile.city || "",
  });
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("users").update({
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
      }).eq("id", profile.id);
      if (error) throw error;
      if (form.email !== profile.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: form.email });
        if (authError) throw authError;
        showToast("Profile u përditësua. Kontrolloni email-in e ri për konfirmim.");
      } else {
        showToast("Profile u përditësua me sukses");
      }
      setProfile({ ...profile, ...form });
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest mb-2">Të dhënat Personale</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Emri</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Telefon</label>
            <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Qyteti</label>
            <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50" />
          </div>
        </div>
        <button onClick={handleUpdateProfile} disabled={saving} className="bg-blue-600 px-8 py-3 rounded-xl font-black uppercase italic text-sm hover:bg-blue-500 transition-all disabled:opacity-50">
          {saving ? "Duke ruajtur..." : "Ruaj Ndryshimet"}
        </button>
      </div>
    </div>
  );
}
