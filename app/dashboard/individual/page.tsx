"use client";
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { 
  Package, History, Plus, X, Upload, LayoutDashboard, Briefcase, 
  ShieldCheck, User, FileDown, LogOut, CheckCircle2, PieChart, 
  AlertTriangle, Edit2, Save, TrendingUp, DollarSign, Eye, Trash2,
  Check, MessageCircle, Phone, MapPin, Calendar, BarChart3, Clock,
  Award, FileText, Loader2, CreditCard, Key, AlertCircle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function IndividualDashboard() {
  const router = useRouter();
  const [view, setView] = useState<'home' | 'inventory' | 'sales' | 'profile' | 'security' | 'analytics'>('home');
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  
  const [sellerData, setSellerData] = useState({ 
    name: '', email: '', phone: '', city: '', current_debt: 0, total_paid: 0,
    business_license: '', license_verified: false
  });
  const [myParts, setMyParts] = useState<any[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newPart, setNewPart] = useState({ 
    title: '', model: '', year: '', price: '', description: '', category: '' 
  });
  const [sales, setSales] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', city: '' });
  const [confirmingSale, setConfirmingSale] = useState<string | null>(null);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  
  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  // Payment method placeholder
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Limits
  const MAX_ACTIVE_PARTS = 20;
  const PART_EXPIRY_DAYS = 20;

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      await fetchSellerData(user.id);
      await fetchParts(user.id);
      await fetchSales(user.id);
      await checkAndExpireParts(user.id);
      setLoading(false);
    };
    getUser();
  }, []);

  async function fetchSellerData(uid: string) {
    const { data } = await supabase
      .from('users')
      .select('name, email, phone, city, current_debt, total_paid, business_license, license_verified')
      .eq('id', uid)
      .single();
    if (data) {
      setSellerData(data);
      setEditForm({ name: data.name, phone: data.phone || '', city: data.city || '' });
    }
  }

  async function fetchParts(uid: string) {
    const { data } = await supabase
      .from('parts')
      .select('*')
      .eq('seller_id', uid)
      .order('created_at', { ascending: false });
    if (data) setMyParts(data);
  }

  async function fetchSales(uid: string) {
    const { data } = await supabase
      .from('parts')
      .select('id, title, price, created_at')
      .eq('seller_id', uid)
      .eq('status', 'Sold');
    if (data) setSales(data.map(p => ({ ...p, date: p.created_at.split('T')[0] })));
  }

  async function checkAndExpireParts(uid: string) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - PART_EXPIRY_DAYS);
    const cutoffStr = cutoff.toISOString();
    const { data: oldParts } = await supabase
      .from('parts')
      .select('id')
      .eq('seller_id', uid)
      .lt('created_at', cutoffStr)
      .eq('status', 'Active');
    if (oldParts && oldParts.length > 0) {
      for (const part of oldParts) {
        await supabase.from('parts').update({ status: 'Deleted' }).eq('id', part.id);
      }
      await fetchParts(uid);
      alert(`${oldParts.length} pjesë të vjetra u fshinë automatikisht (më të vjetra se ${PART_EXPIRY_DAYS} ditë).`);
    }
  }

  const totalCommissionPaid = sales.reduce((acc, s) => acc + (s.price * 0.03), 0);
  const activePartsCount = myParts.filter(p => p.status !== 'Sold' && p.status !== 'Deleted').length;
  const totalBalance = sales.reduce((acc, s) => acc + (s.price - 1 - (s.price * 0.03)), 0);
  const totalViews = myParts.reduce((acc, p) => acc + (p.views || 0), 0);

  const viewsPerPart = myParts.filter(p => p.status !== 'Deleted').map(p => ({
    name: p.title.substring(0, 15),
    views: p.views || 0,
    price: p.price
  }));
  const salesOverTime = sales.map(s => ({
    date: s.date,
    amount: s.price
  })).reverse();

  const generatePDF = () => {
    const doc = new jsPDF();
    const companyName = sellerData.name || 'Individual Seller';
    const email = sellerData.email;
    const generatedDate = new Date().toLocaleDateString('sq-AL');
    
    doc.setFontSize(18);
    doc.text(`Raporti i Shitjeve - ${companyName}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Email: ${email} | Data: ${generatedDate}`, 14, 30);
    
    const tableData = sales.map(s => [
      s.title,
      s.date,
      `${s.price}€`,
      `${(s.price * 0.03).toFixed(2)}€`
    ]);
    
    autoTable(doc, {
      startY: 40,
      head: [['Produkti', 'Data e shitjes', 'Çmimi', 'Komisioni (3%)']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Total i shitjeve: ${sales.reduce((a,b)=>a+b.price,0)}€`, 14, finalY);
    doc.text(`Komision total i paguar: ${totalCommissionPaid.toFixed(2)}€`, 14, finalY + 8);
    doc.text(`Powered by Enklan Sh.p.k`, 14, finalY + 20);
    doc.save(`raporti_shitjeve_${companyName.replace(/\s/g, '_')}.pdf`);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activePartsCount >= MAX_ACTIVE_PARTS) {
      alert(`Ju keni arritur limitin maksimal prej ${MAX_ACTIVE_PARTS} pjesësh aktive. Fshini disa pjesë për të shtuar të reja.`);
      return;
    }
    if (!newPart.title || !newPart.price) return alert("Plotësoni të dhënat!");
    if (sellerData.current_debt > 0) {
      alert("Nuk mund të publikoni pjesë të reja derisa të shlyeni borxhin.");
      return;
    }
    const confirmPost = window.confirm(`A jeni i sigurt që dëshironi të publikoni këtë pjesë?\n\nEmri: ${newPart.title}\nÇmimi: ${newPart.price}€`);
    if (!confirmPost) return;
    const { error } = await supabase.from('parts').insert({
      seller_id: userId,
      title: newPart.title,
      price: parseFloat(newPart.price),
      model: newPart.model,
      year: newPart.year,
      category: newPart.category,
      description: newPart.description,
      image_url: previewUrl,
      status: 'Active',
      views: 0
    });
    if (error) {
      alert("Gabim gjatë publikimit.");
    } else {
      await fetchParts(userId!);
      setShowUpload(false);
      setPreviewUrl(null);
      setNewPart({ title: '', model: '', year: '', price: '', description: '', category: '' });
      alert("Pjesa u publikua me sukses!");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLicense(true);
    const fileName = `${userId}_${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage
      .from('licenses')
      .upload(fileName, file);
    if (uploadError) {
      alert("Gabim gjatë ngarkimit të licencës.");
      setUploadingLicense(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('licenses').getPublicUrl(fileName);
    const { error: updateError } = await supabase
      .from('users')
      .update({ business_license: publicUrl })
      .eq('id', userId);
    if (updateError) {
      alert("Gabim gjatë ruajtjes së licencës.");
    } else {
      setSellerData({ ...sellerData, business_license: publicUrl });
      alert("Licenca u ngarkua me sukses!");
    }
    setUploadingLicense(false);
  };

  const updateProfile = async () => {
    const { error } = await supabase
      .from('users')
      .update({ name: editForm.name, phone: editForm.phone, city: editForm.city })
      .eq('id', userId);
    if (!error) {
      setSellerData({ ...sellerData, name: editForm.name, phone: editForm.phone, city: editForm.city });
      setEditMode(false);
      alert("Profili u përditësua!");
    } else {
      alert("Gabim gjatë ruajtjes.");
    }
  };

  const confirmSale = async (partId: string) => {
    setConfirmingSale(partId);
    const { error } = await supabase
      .from('parts')
      .update({ status: 'Sold' })
      .eq('id', partId);
    if (!error) {
      await fetchParts(userId!);
      await fetchSales(userId!);
      alert("Pjesa u shënua si e shitur!");
    } else {
      alert("Gabim gjatë shënimit të shitjes.");
    }
    setConfirmingSale(null);
  };

  const deletePart = async (partId: string) => {
    if (confirm("A jeni i sigurt që doni të fshini këtë pjesë? Ky veprim është i pakthyeshëm.")) {
      const { error } = await supabase
        .from('parts')
        .delete()
        .eq('id', partId);
      if (!error) {
        await fetchParts(userId!);
        alert("Pjesa u fshi.");
      } else {
        alert("Gabim gjatë fshirjes.");
      }
    }
  };

  // Password change
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Fjalëkalimet nuk përputhen.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Fjalëkalimi duhet të ketë të paktën 6 karaktere.");
      return;
    }
    setChangingPassword(true);
    setPasswordError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: sellerData.email,
      password: currentPassword,
    });
    if (signInError) {
      setPasswordError("Fjalëkalimi aktual është i pasaktë.");
      setChangingPassword(false);
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setPasswordError(updateError.message);
    } else {
      alert("Fjalëkalimi u ndryshua me sukses!");
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setChangingPassword(false);
  };

  // Account deletion via API route
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'FSHIJE') {
      alert("Shkruani 'FSHIJE' për të konfirmuar fshirjen.");
      return;
    }
    setDeletingAccount(true);
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await supabase.auth.signOut();
      router.push('/');
    } catch (err: any) {
      console.error(err);
      alert("Gabim gjatë fshirjes së llogarisë. Kontaktoni mbështetjen.");
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-blue-500">Duke ngarkuar...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-80 bg-[#0A0A0A] border-r border-white/5 flex flex-col h-screen sticky top-0 z-50">
          <div className="p-8 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-linear-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-2xl font-black italic shadow-lg shadow-blue-600/20">
                {sellerData.name?.charAt(0) || 'I'}
              </div>
              <div>
                <h2 className="font-black uppercase italic text-sm tracking-tighter">{sellerData.name || 'INDIVIDUAL'}</h2>
                <p className="text-[9px] text-green-500 font-black uppercase mt-2 italic tracking-widest">● PANEL AKTIV</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-6 space-y-2">
            <button onClick={() => setView('home')} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${view === 'home' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
              <LayoutDashboard size={18}/> Paneli Kryesor
            </button>
            <button onClick={() => setView('inventory')} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${view === 'inventory' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
              <Package size={18}/> Inventari Im
            </button>
            <button onClick={() => setView('sales')} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${view === 'sales' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
              <History size={18}/> Regjistri Shitjeve
            </button>
            <button onClick={() => setView('analytics')} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${view === 'analytics' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
              <BarChart3 size={18}/> Analitika
            </button>
            <div className="pt-8 mt-8 border-t border-white/5">
              <button onClick={() => setView('profile')} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${view === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
                <Briefcase size={18}/> Profili
              </button>
              <button onClick={() => setView('security')} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${view === 'security' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
                <ShieldCheck size={18}/> Siguria
              </button>
            </div>
          </nav>
          <div className="p-6 border-t border-white/5">
            <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase italic text-red-500 hover:bg-red-500/10 transition-all">
              <LogOut size={18}/> Dil
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="p-10 pb-20">
            {/* Home Tab */}
            {view === 'home' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-6xl md:text-7xl font-black italic uppercase mb-8 tracking-tighter">PANELI <span className="text-blue-600">KRYESOR</span></h1>
                {activePartsCount >= MAX_ACTIVE_PARTS && (
                  <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-3xl flex items-center gap-4">
                    <AlertTriangle className="text-yellow-500" size={32} />
                    <div>
                      <p className="font-black italic text-yellow-500 uppercase">Limit i pjesëve aktive: {activePartsCount}/{MAX_ACTIVE_PARTS}</p>
                      <p className="text-xs text-zinc-400">Fshini disa pjesë për të shtuar të reja.</p>
                    </div>
                  </div>
                )}
                {sellerData.current_debt > 0 && (
                  <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 animate-pulse">
                    <AlertTriangle className="text-red-500" size={32} />
                    <div>
                      <p className="font-black italic text-red-500 uppercase">Borxhi i papaguar: {sellerData.current_debt}€</p>
                      <p className="text-xs text-zinc-400">Shlyeni borxhin për të vazhduar publikimin e pjesëve të reja.</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  <div onClick={() => setView('inventory')} className="cursor-pointer bg-linear-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-xl hover:scale-[1.02] transition-all">
                    <Package size={28} className="mb-3 opacity-80" />
                    <h3 className="text-3xl font-black italic">{activePartsCount}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Pjesë Online</p>
                  </div>
                  <div onClick={() => setView('sales')} className="cursor-pointer bg-[#111111] border border-white/5 p-6 rounded-2xl hover:border-green-500/30 transition-all">
                    <CheckCircle2 size={28} className="mb-3 text-green-500 opacity-80" />
                    <h3 className="text-3xl font-black italic text-green-500">{sales.length}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pjesë të Shitura</p>
                  </div>
                  <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl">
                    <Eye size={28} className="mb-3 text-blue-500 opacity-80" />
                    <h3 className="text-3xl font-black italic text-white">{totalViews}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Shikime Gjithsej</p>
                  </div>
                  <div className="bg-[#111111] border border-white/5 p-6 rounded-2xl">
                    <DollarSign size={28} className="mb-3 text-yellow-500 opacity-80" />
                    <h3 className="text-3xl font-black italic text-white">{totalBalance.toFixed(0)}€</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Bilanci Total</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => setShowUpload(true)} className="bg-white text-black px-8 py-4 rounded-full font-black uppercase italic text-sm tracking-wider hover:bg-blue-600 hover:text-white transition-all shadow-xl flex items-center gap-3">
                    <Plus size={20} /> Shto Pjesë të Re
                  </button>
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {view === 'inventory' && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-5xl md:text-6xl font-black italic mb-8 tracking-tighter">INVENTARI IM</h2>
                {activePartsCount >= MAX_ACTIVE_PARTS && (
                  <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-sm">
                    <span className="font-black">⚠️ Limit i arritur:</span> Keni {activePartsCount}/{MAX_ACTIVE_PARTS} pjesë aktive. Fshini disa për të shtuar të reja.
                  </div>
                )}
                {myParts.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <Package size={48} className="mx-auto text-zinc-800 mb-4" />
                    <p className="text-zinc-500 font-black uppercase italic text-sm">Nuk keni asnjë pjesë të listuar.</p>
                    <button onClick={() => setShowUpload(true)} className="mt-6 bg-blue-600 px-6 py-3 rounded-full text-sm font-black uppercase italic">Shto Pjesën e Parë</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {myParts.map(part => {
                      const isExpired = new Date(part.created_at) < new Date(Date.now() - PART_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
                      return (
                        <div key={part.id} className="group bg-[#111111] border border-white/5 rounded-3xl overflow-hidden hover:border-blue-600/30 hover:scale-[1.02] transition-all duration-300">
                          <div className="aspect-square bg-black relative overflow-hidden">
                            {part.image_url ? (
                              <img src={part.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={part.title} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Package size={48} className="text-zinc-800" /></div>
                            )}
                            <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-2xl font-black italic text-lg shadow-lg">
                              {part.price}€
                            </div>
                            {part.status === 'Sold' && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="bg-red-500 text-white px-6 py-2 rounded-full text-sm font-black uppercase italic">SHITUR</span>
                              </div>
                            )}
                            {isExpired && part.status !== 'Sold' && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-black uppercase italic">SKADUAR</span>
                              </div>
                            )}
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-black italic uppercase tracking-tight">{part.title}</h3>
                            <p className="text-[10px] text-blue-500 font-black uppercase tracking-wider mt-1">{part.model} • {part.year}</p>
                            <p className="text-xs text-zinc-500 mt-3 line-clamp-2">{part.description?.substring(0, 100)}...</p>
                            <div className="flex items-center gap-4 mt-4 text-[10px] text-zinc-500">
                              <span className="flex items-center gap-1"><Eye size={12}/> {part.views || 0} shikime</span>
                              <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(part.created_at).toLocaleDateString()}</span>
                            </div>
                            {part.status !== 'Sold' && !isExpired && (
                              <div className="flex gap-3 mt-6">
                                <button onClick={() => confirmSale(part.id)} disabled={confirmingSale === part.id} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all">
                                  {confirmingSale === part.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14}/>} Shëno të Shitur
                                </button>
                                <button onClick={() => deletePart(part.id)} className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white py-2 px-4 rounded-xl transition-all">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                            {isExpired && part.status !== 'Sold' && (
                              <div className="mt-6 p-2 bg-red-500/10 text-red-400 text-center text-[9px] font-black uppercase rounded-xl">
                                Skaduar (më i vjetër se {PART_EXPIRY_DAYS} ditë)
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sales Tab */}
            {view === 'sales' && (
              <div className="animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                  <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter">REGJISTRI I SHITJEVE</h2>
                  <button onClick={generatePDF} className="bg-white text-black px-6 py-3 rounded-full font-black italic text-[10px] flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all">
                    <FileDown size={16}/> GJENERO PDF
                  </button>
                </div>
                <div className="mb-8">
                  <div className="bg-[#111111] border border-white/5 p-4 rounded-2xl inline-block">
                    <p className="text-[10px] font-black uppercase text-zinc-500">Komision i Paguar</p>
                    <p className="text-2xl font-black italic text-green-500">{totalCommissionPaid.toFixed(2)}€</p>
                  </div>
                </div>
                {sales.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <History size={48} className="mx-auto text-zinc-800 mb-4" />
                    <p className="text-zinc-500 font-black uppercase italic text-sm">Nuk keni asnjë shitje të regjistruar.</p>
                  </div>
                ) : (
                  <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
                    <table className="w-full text-left font-black italic uppercase">
                      <thead className="bg-white/5 text-[10px] text-zinc-500 tracking-wider">
                        <tr><th className="p-6">Produkti</th><th className="p-6 text-center">Data</th><th className="p-6 text-center">Komisioni (3%)</th><th className="p-6 text-center">Çmimi</th></tr>
                      </thead>
                      <tbody>
                        {sales.map(s => (
                          <tr key={s.id} className="border-t border-white/5 hover:bg-white/5 transition-all">
                            <td className="p-6 text-xl">{s.title}</td>
                            <td className="p-6 text-center text-zinc-500 text-sm">{s.date}</td>
                            <td className="p-6 text-center text-red-500">{(s.price * 0.03).toFixed(2)}€</td>
                            <td className="p-6 text-center text-blue-600 text-3xl">{s.price}€</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {view === 'analytics' && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-5xl md:text-6xl font-black italic mb-8 tracking-tighter">ANALITIKA</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-[#111111] border border-white/5 p-6 rounded-3xl">
                    <h3 className="text-lg font-black italic mb-4">Shikime për Pjesë</h3>
                    {viewsPerPart.length === 0 ? (
                      <p className="text-zinc-500 text-center py-10">Nuk ka të dhëna për shikime.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={viewsPerPart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="name" stroke="#888" fontSize={10} angle={-45} textAnchor="end" height={60} />
                          <YAxis stroke="#888" />
                          <Tooltip contentStyle={{ backgroundColor: "#111", borderColor: "#D4AF37" }} />
                          <Bar dataKey="views" fill="#D4AF37" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <div className="bg-[#111111] border border-white/5 p-6 rounded-3xl">
                    <h3 className="text-lg font-black italic mb-4">Shitjet në Kohë</h3>
                    {salesOverTime.length === 0 ? (
                      <p className="text-zinc-500 text-center py-10">Nuk ka të dhëna për shitje.</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesOverTime}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="date" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip contentStyle={{ backgroundColor: "#111", borderColor: "#D4AF37" }} />
                          <Line type="monotone" dataKey="amount" stroke="#D4AF37" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {view === 'profile' && (
              <div className="max-w-4xl animate-in slide-in-from-left-4 duration-500">
                <h2 className="text-5xl md:text-6xl font-black italic mb-8 tracking-tighter">PROFILI IM</h2>
                <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl space-y-6">
                  {editMode ? (
                    <>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div><label className="text-[10px] font-black uppercase text-zinc-500">Emri</label><input value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white mt-1" /></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-500">WhatsApp/Telefon</label><input value={editForm.phone} onChange={e=>setEditForm({...editForm, phone:e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white mt-1" /></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-500">Qyteti</label><input value={editForm.city} onChange={e=>setEditForm({...editForm, city:e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white mt-1" /></div>
                      </div>
                      <div className="flex gap-4 pt-4"><button onClick={updateProfile} className="bg-green-600 px-8 py-3 rounded-xl font-black uppercase text-sm flex items-center gap-2"><Save size={16}/> Ruaj Ndryshimet</button><button onClick={()=>setEditMode(false)} className="bg-white/10 px-8 py-3 rounded-xl">Anulo</button></div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div><p className="text-[10px] font-black uppercase text-zinc-500">Emri</p><p className="text-white font-bold text-lg">{sellerData.name}</p></div>
                        <div><p className="text-[10px] font-black uppercase text-zinc-500">Email</p><p className="text-white">{sellerData.email}</p></div>
                        <div><p className="text-[10px] font-black uppercase text-zinc-500">WhatsApp/Telefon</p><p className="text-white">{sellerData.phone || '-'}</p></div>
                        <div><p className="text-[10px] font-black uppercase text-zinc-500">Qyteti</p><p className="text-white">{sellerData.city || '-'}</p></div>
                      </div>
                      <div className="border-t border-white/5 pt-4">
                        <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Licencë Biznesi (opsionale)</p>
                        {sellerData.business_license ? (
                          <div className="flex items-center gap-3">
                            <a href={sellerData.business_license} target="_blank" className="text-blue-500 text-sm underline">Shiko licencën</a>
                            <button onClick={() => licenseInputRef.current?.click()} className="bg-white/10 px-4 py-2 rounded-xl text-xs">Ndrysho</button>
                          </div>
                        ) : (
                          <button onClick={() => licenseInputRef.current?.click()} className="bg-white/10 px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                            {uploadingLicense ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14}/>} Ngarko Licencën
                          </button>
                        )}
                        <input type="file" ref={licenseInputRef} onChange={handleLicenseUpload} className="hidden" accept="image/*,application/pdf" />
                        {sellerData.license_verified && <p className="text-green-500 text-[9px] mt-1">✓ Licenca e verifikuar</p>}
                      </div>
                      <div className="border-t border-white/5 pt-4 flex justify-between items-center">
                        <div><p className="text-[10px] font-black uppercase text-zinc-500">Borxhi aktual</p><p className="text-red-500 text-2xl font-black italic">{sellerData.current_debt}€</p></div>
                        <div><p className="text-[10px] font-black uppercase text-zinc-500">Total i paguar</p><p className="text-green-500 text-2xl font-black italic">{sellerData.total_paid}€</p></div>
                        <button onClick={()=>setEditMode(true)} className="bg-blue-600 px-6 py-2 rounded-xl font-black uppercase text-sm flex items-center gap-2"><Edit2 size={14}/> Ndrysho</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {view === 'security' && (
              <div className="max-w-4xl animate-in fade-in duration-500">
                <h2 className="text-5xl md:text-6xl font-black italic mb-8 tracking-tighter">SIGURIA DIGJITALE</h2>
                <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl space-y-6">
                  <div>
                    <h3 className="text-lg font-black italic mb-2">Ndrysho Fjalëkalimin</h3>
                    <p className="text-xs text-zinc-500 mb-4">Ndryshoni fjalëkalimin tuaj të hyrjes.</p>
                    <button onClick={() => setShowPasswordModal(true)} className="bg-blue-600 px-6 py-3 rounded-xl font-black uppercase text-sm hover:bg-blue-500 transition-all flex items-center gap-2">
                      <Key size={16}/> Ndrysho Fjalëkalimin
                    </button>
                  </div>
                  <div className="border-t border-white/5 pt-6">
                    <h3 className="text-lg font-black italic mb-2 text-red-500">Fshirja e Llogarisë</h3>
                    <p className="text-xs text-zinc-500 mb-4">Ky veprim është i pakthyeshëm. Të gjitha të dhënat tuaja do të fshihen përgjithmonë.</p>
                    <button onClick={() => setShowDeleteModal(true)} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-6 py-3 rounded-xl font-black uppercase text-sm transition-all flex items-center gap-2">
                      <Trash2 size={16}/> Fshi Llogarinë
                    </button>
                  </div>
                  <div className="border-t border-white/5 pt-6">
                    <h3 className="text-lg font-black italic mb-2">Metoda e Pagesës</h3>
                    <p className="text-xs text-zinc-500 mb-4">Shtoni një metodë pagese për të marrë pagesat nga shitjet tuaja.</p>
                    <button onClick={() => setShowPaymentModal(true)} className="bg-white/10 px-6 py-3 rounded-xl font-black uppercase text-sm hover:bg-white/20 transition-all flex items-center gap-2">
                      <CreditCard size={16}/> Shto Kartën e Pagesës
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="border-t border-white/5 py-6 px-10 mt-auto">
            <div className="text-center">
              <p className="text-[10px] text-zinc-600 font-black uppercase italic tracking-wider">
                Powered by <span className="text-green-500 hover:text-green-400 transition-colors">Enklan Sh.p.k</span>
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-200 bg-black/70 flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black uppercase text-white">Ndrysho Fjalëkalimin</h3>
              <button onClick={() => { setShowPasswordModal(false); setPasswordError(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <input type="password" placeholder="Fjalëkalimi aktual" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
              <input type="password" placeholder="Fjalëkalimi i ri" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
              <input type="password" placeholder="Konfirmo fjalëkalimin e ri" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
              {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
              <button onClick={handlePasswordChange} disabled={changingPassword} className="w-full bg-blue-600 py-3 rounded-xl font-black uppercase text-sm disabled:opacity-50">
                {changingPassword ? 'Duke ndryshuar...' : 'Ndrysho Fjalëkalimin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-200 bg-black/70 flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-[#0A0A0A] border border-red-500/20 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black uppercase text-red-500">Fshi Llogarinë</h3>
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}><X size={20} /></button>
            </div>
            <p className="text-sm text-zinc-400 mb-4">Ky veprim është i pakthyeshëm. Të gjitha pjesët, shitjet dhe të dhënat tuaja do të fshihen përgjithmonë.</p>
            <p className="text-xs text-zinc-500 mb-2">Shkruani <span className="font-bold text-red-500">FSHIJE</span> për të konfirmuar:</p>
            <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="FSHIJE" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white mb-4" />
            <button onClick={handleDeleteAccount} disabled={deletingAccount} className="w-full bg-red-600 py-3 rounded-xl font-black uppercase text-sm disabled:opacity-50">
              {deletingAccount ? 'Duke fshirë...' : 'Konfirmo Fshirjen'}
            </button>
          </div>
        </div>
      )}

      {/* Payment Method Modal (placeholder) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-200 bg-black/70 flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black uppercase text-white">Shto Metodë Pagese</h3>
              <button onClick={() => setShowPaymentModal(false)}><X size={20} /></button>
            </div>
            <div className="text-center py-8">
              <CreditCard size={48} className="mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-500 text-sm mb-2">Ky funksionalitet do të shtohet së shpejti.</p>
              <p className="text-xs text-zinc-600">Ju do të mund të shtoni kartën tuaj të kreditit/debitit për të marrë pagesa.</p>
            </div>
            <button onClick={() => setShowPaymentModal(false)} className="w-full bg-white/10 py-3 rounded-xl font-black uppercase text-sm">Mbyll</button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 backdrop-blur-xl bg-black/80">
          <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-2xl rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowUpload(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={24}/></button>
            <h2 className="text-3xl font-black italic mb-6">Shto Pjesë të Re</h2>
            {activePartsCount >= MAX_ACTIVE_PARTS && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-500">
                ⚠️ Keni arritur limitin maksimal prej {MAX_ACTIVE_PARTS} pjesësh aktive. Fshini disa pjesë për të shtuar të reja.
              </div>
            )}
            <form onSubmit={handleUpload} className="space-y-6">
              <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-600/50 transition-all">
                {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover rounded-2xl" /> : <><Upload size={32} className="text-zinc-600"/><p className="text-[10px] mt-2">Kliko për të ngarkuar foton</p></>}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Emri i Pjesës*" value={newPart.title} onChange={e=>setNewPart({...newPart, title:e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-4 text-white" required />
                <input placeholder="Çmimi (€)*" type="number" value={newPart.price} onChange={e=>setNewPart({...newPart, price:e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-4 text-white" required />
                <input placeholder="Modeli" value={newPart.model} onChange={e=>setNewPart({...newPart, model:e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-4 text-white" />
                <input placeholder="Viti" value={newPart.year} onChange={e=>setNewPart({...newPart, year:e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-4 text-white" />
                <input placeholder="Kategoria" value={newPart.category} onChange={e=>setNewPart({...newPart, category:e.target.value})} className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-4 text-white" />
                <textarea placeholder="Përshkrimi" rows={3} value={newPart.description} onChange={e=>setNewPart({...newPart, description:e.target.value})} className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-4 text-white resize-none" />
              </div>
              <button type="submit" disabled={activePartsCount >= MAX_ACTIVE_PARTS} className="w-full bg-green-600 py-4 rounded-xl font-black uppercase italic text-sm hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                PUBLIKO PJESËN
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}