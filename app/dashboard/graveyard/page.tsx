"use client";
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { 
  Package, History, Plus, X, Upload, LayoutDashboard, Briefcase, 
  ShieldCheck, User, FileDown, LogOut, CheckCircle2, PieChart, 
  AlertTriangle, Edit2, Save, TrendingUp, DollarSign, Eye, Trash2,
  Check, MessageCircle, Phone, MapPin, Calendar, BarChart3, Clock,
  Award, FileText, Loader2, CreditCard, Key, AlertCircle, Building, Menu, Search, Bell, BellRing, RefreshCw, MessageSquare
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import Image from 'next/image';
import { Part, Notification, Payment, User as UserType, BuyerLead } from '@/types';

const MONTHLY_FEE = 50;

export default function GraveyardDashboard() {
  const router = useRouter();
  const [view, setView] = useState<'home' | 'inventory' | 'sales' | 'profile' | 'security' | 'analytics' | 'payments' | 'leads'>('home');
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  
  const [sellerData, setSellerData] = useState({ 
    name: '', email: '', phone: '', whatsapp: '', city: '', address: '', nipt: '',
    current_debt: 0, total_paid: 0,
    business_license: '', license_verified: false,
    last_payment_date: '', join_date: ''
  });
  const [myParts, setMyParts] = useState<Part[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newPart, setNewPart] = useState({ 
    title: '', price: '', model: '', year: '', category: '', description: '', oem_number: '', condition: 'E Përdorur', quantity: '1' 
  });
  const [sales, setSales] = useState<Part[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', city: '', address: '', nipt: '' });
  const [confirmingSale, setConfirmingSale] = useState<string | null>(null);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [buyerLeads, setBuyerLeads] = useState<BuyerLead[]>([]);
  
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

  const [toast, setToast] = useState<{message: string, type: "success" | "error"} | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Bulk upload
  const bulkUploadFileRef = useRef<HTMLInputElement>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  
  // Payment method placeholder
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) { router.push('/login'); return; }
        // Verify user_type is seller (not Admin or Individual)
        const { data: profile } = await supabase.from('users').select('user_type').eq('id', user.id).single();
        if (!profile || profile.user_type === 'Admin' || profile.user_type === 'Individual') {
          router.push('/dashboard');
          return;
        }
        setUserId(user.id);
        await fetchSellerData(user.id);
        await fetchParts(user.id);
        await fetchSales(user.id);
        await fetchBuyerLeads(user.id);
        await fetchPayments(user.id);
        await fetchNotifications(user.id);
        setLoading(false);
      } catch {
        router.push('/login');
      }
    };
    getUser();

    // Listen for auth state changes (logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  async function fetchSellerData(uid: string) {
    const { data } = await supabase
      .from('users')
      .select('name, email, phone, whatsapp, city, address, nipt, current_debt, total_paid, business_license, license_verified, last_payment_date, join_date')
      .eq('id', uid)
      .single();
    if (data) {
      setSellerData(data);
      setEditForm({ name: data.name, phone: data.phone || '', city: data.city || '', address: data.address || '', nipt: data.nipt || '' });
    }
  }

  async function fetchParts(uid: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .eq('seller_id', uid)
      .order('created_at', { ascending: false });
    
    if (data) {
      // Auto-delete expired parts permanently (older than 30 days and still Active)
      const expiredParts = data.filter(p => p.status === 'Active' && new Date(p.created_at) < thirtyDaysAgo);
      if (expiredParts.length > 0) {
        const expiredIds = expiredParts.map(p => p.id);
        
        // Remove images from storage first
        for (const part of expiredParts) {
          if (part.image_url) {
            const fileName = part.image_url.split('/').pop();
            if (fileName) {
              await supabase.storage.from('parts').remove([fileName]);
            }
          }
        }

        // Delete from DB
        await supabase.from('parts').delete().in('id', expiredIds);
        
        // Refresh local data
        setMyParts(data.filter(p => !expiredIds.includes(p.id)));
      } else {
        setMyParts(data);
      }
    }
  }

  const fetchSales = async (id: string) => {
    const { data } = await supabase
      .from('parts')
      .select('*')
      .eq('seller_id', id)
      .eq('status', 'Sold');
    if (data) setSales(data.map(p => ({ ...p, date: p.created_at.split('T')[0] })) as Part[]);
  };

  const fetchBuyerLeads = async (id: string) => {
    const { data } = await supabase
      .from('buyer_leads')
      .select('*, parts(*), users!buyer_leads_buyer_id_fkey(name, phone, whatsapp)')
      .eq('seller_id', id)
      .order('created_at', { ascending: false });
    if (data) setBuyerLeads(data as any[]);
  };

  async function fetchPayments(uid: string) {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false });
    if (data) setPayments(data);
  }

  async function fetchNotifications(uid: string) {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  }

  const markNotificationsAsRead = async () => {
    if (unreadCount === 0) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (!error) {
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    }
  };

  // Calculate debt based on subscription
  const calculateDebt = useMemo(() => {
    const lastPayment = sellerData.last_payment_date ? new Date(sellerData.last_payment_date) : null;
    const joinDate = sellerData.join_date ? new Date(sellerData.join_date) : new Date();
    const referenceDate = lastPayment || joinDate;
    const monthsUnpaid = Math.max(0, Math.floor((new Date().getTime() - referenceDate.getTime()) / (1000 * 3600 * 24 * 30)));
    return monthsUnpaid * MONTHLY_FEE;
  }, [sellerData.last_payment_date, sellerData.join_date]);

  // Update debt if it differs from stored value
  useEffect(() => {
    if (calculateDebt !== sellerData.current_debt) {
      setSellerData(prev => ({ ...prev, current_debt: calculateDebt }));
    }
  }, [calculateDebt, sellerData.current_debt]);

  const totalCommissionPaid = sales.reduce((acc, s) => acc + (s.price * 0.03), 0);
  const activePartsCount = myParts.filter(p => p.status !== 'Sold' && p.status !== 'Deleted').length;
  const totalBalance = sales.reduce((acc, s) => acc + (s.price - 1 - (s.price * 0.03)), 0);
  const totalViews = myParts.reduce((acc, p) => acc + (p.views || 0), 0);

  const generatePDF = () => {
    const doc = new jsPDF();
    const companyName = sellerData.name || 'Graveyard';
    const email = sellerData.email;
    const generatedDate = new Date().toLocaleDateString('sq-AL');
    
    doc.setFontSize(18);
    doc.text(`Raporti i Shitjeve - ${companyName}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Email: ${email} | Data: ${generatedDate}`, 14, 30);
    
    const tableData = sales.map(s => [
      s.title,
      s.date || '',
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
    if (!newPart.title || !newPart.price) return alert("Plotësoni të dhënat!");
    if (sellerData.current_debt > 0) {
      alert("Nuk mund të publikoni pjesë të reja derisa të shlyeni borxhin.");
      return;
    }
    const confirmPost = window.confirm(`A jeni i sigurt që dëshironi të publikoni këtë pjesë?\n\nEmri: ${newPart.title}\nÇmimi: ${newPart.price}€`);
    if (!confirmPost) return;

    let uploadedImageUrl = null;
    if (previewUrl) {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const fileName = `${userId}_${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('parts')
        .upload(fileName, blob);
      if (uploadError) {
        alert("Gabim gjatë ngarkimit të fotos.");
        return;
      }
      uploadedImageUrl = supabase.storage.from('parts').getPublicUrl(fileName).data.publicUrl;
    }

    const { error } = await supabase.from('parts').insert({
      seller_id: userId,
      title: newPart.title,
      price: parseFloat(newPart.price),
      model: newPart.model,
      year: newPart.year,
      category: newPart.category,
      description: newPart.description,
      oem_number: newPart.oem_number,
      condition: newPart.condition,
      quantity: parseInt(newPart.quantity) || 1,
      image_url: uploadedImageUrl,
      status: 'Active',
      views: 0
    });
    if (error) {
      alert("Gabim gjatë publikimit.");
    } else {
      await fetchParts(userId!);
      setShowUpload(false);
      setPreviewUrl(null);
      setNewPart({ title: '', price: '', model: '', year: '', category: '', description: '', oem_number: '', condition: 'E Përdorur', quantity: '1' });
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

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBulkUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parts = results.data.map((row: any) => ({
          seller_id: userId,
          title: row.title || row.emri || 'Pjesë e panjohur',
          price: parseFloat(row.price || row.cmimi) || 0,
          model: row.model || row.modeli || '',
          year: parseInt(row.year || row.viti) || new Date().getFullYear(),
          category: row.category || row.kategoria || '',
          description: row.description || row.pershkrimi || '',
          oem_number: row.oem_number || row.oem || '',
          condition: row.condition || row.gjendja || 'E Përdorur',
          quantity: parseInt(row.quantity || row.sasia) || 1,
          status: 'Active',
          views: 0
        }));

        if (parts.length === 0) {
          showToast('Skedari është bosh ose ka format të gabuar.', 'error');
          setIsBulkUploading(false);
          return;
        }

        const { error } = await supabase.from('parts').insert(parts);
        
        if (error) {
          console.error(error);
          showToast('Pati një gabim gjatë ngarkimit të pjesëve.', 'error');
        } else {
          showToast(`${parts.length} pjesë u ngarkuan me sukses!`);
          await fetchParts(userId!);
        }
        
        setIsBulkUploading(false);
        if (bulkUploadFileRef.current) bulkUploadFileRef.current.value = '';
      },
      error: (error: any) => {
        console.error("PapaParse error:", error);
        showToast('Gabim gjatë leximit të skedarit CSV.', 'error');
        setIsBulkUploading(false);
      }
    });
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
      .update({ business_license: publicUrl, license_verified: true })
      .eq('id', userId);
    if (updateError) {
      alert("Gabim gjatë ruajtjes së licencës.");
    } else {
      setSellerData({ ...sellerData, business_license: publicUrl, license_verified: true });
      alert("Licenca u ngarkua me sukses! Llogaria juaj është tani aktive.");
    }
    setUploadingLicense(false);
  };

  const updateProfile = async () => {
    const { error } = await supabase
      .from('users')
      .update({ name: editForm.name, phone: editForm.phone, city: editForm.city, address: editForm.address, nipt: editForm.nipt })
      .eq('id', userId);
    if (!error) {
      setSellerData({ ...sellerData, name: editForm.name, phone: editForm.phone, city: editForm.city, address: editForm.address, nipt: editForm.nipt });
      setEditMode(false);
      alert("Profili u përditësua!");
    } else {
      alert("Gabim gjatë ruajtjes.");
    }
  };

  const confirmSale = async (partId: string) => {
    setConfirmingSale(partId);
    const part = myParts.find(p => p.id === partId);
    if (!part) return;

    const commission = part.price * 0.03;
    const { error } = await supabase
      .from('parts')
      .update({ status: 'Sold' })
      .eq('id', partId);

    if (!error) {
      // Add commission to debt
      const { error: debtError } = await supabase
        .from('users')
        .update({ current_debt: sellerData.current_debt + commission })
        .eq('id', userId);

      if (!debtError) {
        setSellerData(prev => ({ ...prev, current_debt: prev.current_debt + commission }));
      }

      await fetchParts(userId!);
      await fetchSales(userId!);
      showToast(`Pjesa u shënua si e shitur! Komisioni prej ${commission.toFixed(2)}€ u shtua në borxhin tuaj.`);
    } else {
      showToast("Gabim gjatë shënimit të shitjes.", "error");
    }
    setConfirmingSale(null);
  };

  const deletePart = async (partId: string) => {
    if (confirm("A jeni i sigurt që doni të fshini këtë pjesë? Ky veprim është i pakthyeshëm.")) {
      const part = myParts.find(p => p.id === partId);
      
      // Delete from Storage first
      if (part?.image_url) {
        const fileName = part.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('parts').remove([fileName]);
        }
      }

      // Delete from DB
      const { error } = await supabase
        .from('parts')
        .delete()
        .eq('id', partId);

      if (!error) {
        await fetchParts(userId!);
        showToast("Pjesa u fshi përgjithmonë bashkë me foton.");
      } else {
        showToast("Gabim gjatë fshirjes.", "error");
      }
    }
  };

  const relistPart = async (partId: string) => {
    const { error } = await supabase
      .from('parts')
      .update({ status: 'Active', created_at: new Date().toISOString() })
      .eq('id', partId);
    if (!error) {
      await fetchParts(userId!);
      showToast("Pjesa u ri-publikua me sukses!");
    } else {
      showToast("Gabim gjatë ri-publikimit.", "error");
    }
  };

  const dismissLead = async (partId: string, currentLeads: number) => {
    const { error } = await supabase
      .from('parts')
      .update({ leads_processed: currentLeads })
      .eq('id', partId);
    if (!error) {
      await fetchParts(userId!);
    }
  };

  const handleEditPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPart || !editingPart.title || !editingPart.price) return alert("Plotësoni të dhënat!");
    
    const { error } = await supabase
      .from('parts')
      .update({
        title: editingPart.title,
        price: typeof editingPart.price === 'string' ? parseFloat(editingPart.price) : editingPart.price,
        model: editingPart.model,
        year: editingPart.year,
        category: editingPart.category,
        description: editingPart.description,
        oem_number: editingPart.oem_number,
        condition: editingPart.condition,
        quantity: typeof editingPart.quantity === 'string' ? parseInt(editingPart.quantity) : editingPart.quantity
      })
      .eq('id', editingPart.id);

    if (!error) {
      await fetchParts(userId!);
      setEditingPart(null);
      alert("Ndryshimet u ruajtën me sukses!");
    } else {
      alert("Gabim gjatë ruajtjes.");
    }
  };

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

  // Account deletion via request
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'FSHIJE') {
      alert("Shkruani 'FSHIJE' për të konfirmuar kërkesën.");
      return;
    }
    setDeletingAccount(true);
    try {
      const res = await fetch('/api/admin/deletion-requests', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert("Kërkesa për fshirje u dërgua me sukses. Administratori do ta konfirmojë së shpejti.");
      setShowDeleteModal(false);
    } catch (err: any) {
      alert(err.message || "Gabim gjatë dërgimit të kërkesës.");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Function to open license with signed URL
  const openLicense = async () => {
    const res = await fetch('/api/user/license-url');
    const data = await res.json();
    if (data.signedUrl) {
      window.open(data.signedUrl, '_blank');
    } else {
      alert('Nuk mund të shfaqet licenca.');
    }
  };

  const viewsPerPart = useMemo(() => {
    return myParts.map(p => ({
      name: p.title.substring(0, 15) + '...',
      views: p.views || 0
    })).sort((a, b) => b.views - a.views).slice(0, 5);
  }, [myParts]);

  const salesOverTime = useMemo(() => {
    const grouped = sales.reduce((acc, s) => {
      const d = new Date(s.date || s.created_at).toLocaleDateString();
      acc[d] = (acc[d] || 0) + s.price;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped).map(([date, amount]) => ({ date, amount }));
  }, [sales]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-blue-500">Duke ngarkuar...</div>;

  const isVerified = sellerData.license_verified;

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
          
          <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-500/20">
            <ShieldCheck size={40} className="text-blue-500" />
          </div>
          
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Verifikimi i Nevojshëm</h2>
          <p className="text-zinc-500 text-sm leading-relaxed mb-8 italic">
            Llogaria juaj nuk është aktive. Për të publikuar pjesë, duhet të ngarkoni licencën e biznesit (QKL) dhe të prisni miratimin nga administratori.
          </p>

          <div className="space-y-4">
            {!sellerData.business_license ? (
              <>
                <button 
                  onClick={() => licenseInputRef.current?.click()}
                  className="w-full bg-white text-black py-4 rounded-xl font-black uppercase italic text-xs tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3"
                >
                  {uploadingLicense ? <Loader2 size={18} className="animate-spin"/> : <Upload size={18}/>} 
                  Ngarko Licencën Tani
                </button>
                <input type="file" ref={licenseInputRef} onChange={handleLicenseUpload} className="hidden" accept="image/*,application/pdf" />
              </>
            ) : (
              <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl">
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Statusi: Duke u verifikuar</p>
                <p className="text-zinc-500 text-[9px] mt-1 italic uppercase font-bold tracking-tighter">Licenca juaj është dërguar për shqyrtim.</p>
              </div>
            )}

            <button onClick={handleLogout} className="w-full bg-white/5 border border-white/10 py-4 rounded-xl font-black uppercase italic text-xs tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-3 mt-4">
              <LogOut size={18}/> Dil nga llogaria
            </button>
          </div>
          
          <div className="mt-10 pt-8 border-t border-white/5">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Vonesa? Na kontaktoni</p>
            <p className="text-zinc-400 text-xs font-bold mt-1 tracking-tighter uppercase italic">Powered by Enklan Sh.p.k</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-2xl z-[100] border backdrop-blur-xl transition-all ${
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          <p className="font-bold text-sm">{toast.message}</p>
        </div>
      )}

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-[#0A0A0A] border-b border-white/5 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-lg font-black italic shadow-lg shadow-blue-600/20">
              {sellerData.name?.charAt(0) || 'G'}
            </div>
            <h2 className="font-black uppercase italic text-[10px] tracking-tighter text-blue-500">VEKTRA</h2>
            <h2 className="font-black uppercase italic text-xs tracking-tighter">{sellerData.name || 'GRAVEYARD'}</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification Bell Mobile */}
            <div className="relative">
              <button 
                onClick={() => { setShowNotifications(!showNotifications); markNotificationsAsRead(); }}
                className={`p-2 rounded-xl transition-all ${unreadCount > 0 ? 'text-blue-500 animate-pulse' : 'text-zinc-500'}`}
              >
                {unreadCount > 0 ? <BellRing size={22} /> : <Bell size={22} />}
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-600 rounded-full text-[8px] font-black flex items-center justify-center text-white border-2 border-black">{unreadCount}</span>}
              </button>
              
              {showNotifications && (
                <div className="fixed inset-x-4 top-20 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in slide-in-from-top-2 duration-300">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Njoftimet</h4>
                    <button onClick={() => setShowNotifications(false)}><X size={16}/></button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-zinc-600 text-[10px] uppercase font-bold">Asnjë njoftim</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-all ${!n.is_read ? 'bg-blue-600/5' : ''}`}>
                          <p className="text-xs text-white leading-relaxed mb-1 font-medium">{n.message}</p>
                          <p className="text-[8px] text-zinc-600 font-black uppercase">{new Date(n.created_at).toLocaleString('sq-AL')}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Sidebar - Desktop & Mobile */}
        <aside className={`
          fixed lg:sticky lg:top-0 left-0 bottom-0 w-80 bg-[#0A0A0A] border-r border-white/5 flex flex-col h-screen z-40 transition-transform duration-300
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}>
          <div className="p-8 border-b border-white/5 hidden lg:block">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-linear-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-2xl font-black italic shadow-lg shadow-blue-600/20">
                {sellerData.name?.charAt(0) || 'G'}
              </div>
              <div>
                <h2 className="font-black uppercase italic text-[10px] tracking-tighter text-blue-500">VEKTRA</h2>
                <h2 className="font-black uppercase italic text-sm tracking-tighter">{sellerData.name || 'GRAVEYARD'}</h2>
                <p className="text-[9px] text-green-500 font-black uppercase mt-2 italic tracking-widest">● PANEL AKTIV</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
            <div className="relative mb-4">
              <button 
                onClick={() => { setShowNotifications(!showNotifications); markNotificationsAsRead(); }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${unreadCount > 0 ? 'bg-blue-600/10 border-blue-500/50 text-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.1)]' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-white hover:bg-white/10'}`}
              >
                <div className="flex items-center gap-4">
                  {unreadCount > 0 ? <BellRing size={18} className="animate-pulse" /> : <Bell size={18} />}
                  <span className="text-[10px] font-black uppercase italic tracking-widest">Njoftimet</span>
                </div>
                {unreadCount > 0 && <span className="bg-red-600 px-2 py-0.5 rounded-full text-[9px] font-black text-white">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="absolute left-full ml-4 top-0 w-80 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-left-2 duration-300">
                  <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Njoftimet e Fundit</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-zinc-600 hover:text-white"><X size={14}/></button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-zinc-600 text-[10px] uppercase font-bold">Asnjë njoftim</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-all ${!n.is_read ? 'bg-blue-600/5 border-l-2 border-blue-600' : ''}`}>
                          <p className="text-xs text-zinc-300 leading-relaxed mb-1 font-medium">{n.message}</p>
                          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-tighter">{new Date(n.created_at).toLocaleString('sq-AL')}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => { setView('home'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${view === 'home' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
              <LayoutDashboard size={18}/> Paneli Kryesor
            </button>
            <button onClick={() => { setView('inventory'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${view === 'inventory' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
              <Package size={18}/> Inventari Im
            </button>
            <button onClick={() => { setView('leads'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${view === 'leads' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
              <MessageSquare size={18}/> Kërkesat
              {buyerLeads.filter(l => l.status === 'contacted').length > 0 && (
                <span className="ml-auto bg-yellow-500 text-black px-2 py-0.5 rounded-full text-[9px] font-black">{buyerLeads.filter(l => l.status === 'contacted').length}</span>
              )}
            </button>
            <button onClick={() => { setView('sales'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${view === 'sales' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
              <History size={18}/> Regjistri Shitjeve
            </button>
            <button onClick={() => { setView('analytics'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${view === 'analytics' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
              <BarChart3 size={18}/> Analitika
            </button>
            <button onClick={() => { setView('payments'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${view === 'payments' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
              <CreditCard size={18}/> Historia e Pagesave
            </button>
            <div className="pt-8 mt-8 border-t border-white/5">
              <button onClick={() => { setView('profile'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${view === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
                <Briefcase size={18}/> Profili
              </button>
              <button onClick={() => { setView('security'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-black uppercase italic transition-all ${view === 'security' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}`}>
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

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <main className="flex-1 overflow-x-hidden">
          <div className="p-4 md:p-10 pb-20">
            {/* LEADS VIEW */}
            {view === 'leads' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-yellow-500">Kërkesat nga Blerësit</h2>
                <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      <tr>
                        <th className="py-4 px-6">Pjesa</th>
                        <th className="py-4 px-6">Blerësi</th>
                        <th className="py-4 px-6">Data</th>
                        <th className="py-4 px-6">Veprimi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {buyerLeads.filter(l => l.status === 'contacted').map(lead => (
                        <tr key={lead.id} className="hover:bg-white/[0.02]">
                          <td className="py-4 px-6 font-bold">{lead.parts?.title}</td>
                          <td className="py-4 px-6 text-sm">{lead.users?.name || lead.users?.phone}</td>
                          <td className="py-4 px-6 text-zinc-400 text-sm">{new Date(lead.created_at).toLocaleDateString('sq-AL')}</td>
                          <td className="py-4 px-6">
                            <div className="flex gap-2">
                              <button 
                                onClick={async () => {
                                  await supabase.from('buyer_leads').update({ status: 'sold' }).eq('id', lead.id);
                                  confirmSale(lead.part_id); 
                                }}
                                className="bg-emerald-600/10 text-emerald-500 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600/20"
                              >
                                Shitur Këtij
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {buyerLeads.filter(l => l.status === 'contacted').length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-zinc-500">Nuk keni kërkesa të reja.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Home Tab */}
            {view === 'home' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h1 className="text-4xl md:text-7xl font-black italic uppercase mb-8 tracking-tighter">PANELI <span className="text-blue-600">KRYESOR</span></h1>
                {sellerData.current_debt > 0 && (
                  <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 animate-pulse">
                    <AlertTriangle className="text-red-500" size={32} />
                    <div>
                      <p className="font-black italic text-red-500 uppercase">Borxhi i papaguar: {sellerData.current_debt}€</p>
                      <p className="text-xs text-zinc-400">Ju lutemi shlyeni borxhin për të vazhduar publikimin e pjesëve të reja.</p>
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

                <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl flex items-start gap-4 mb-8">
                  <Clock className="text-blue-500 shrink-0" size={24}/>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1">Politika e Inventarit</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed italic">Të gjitha pjesët që nuk shiten brenda <span className="text-white font-bold">30 ditëve</span> <span className="text-red-500 font-bold uppercase underline">fshihen përgjithmonë</span> bashkë me fotot për të mbajtur sistemin të pastër.</p>
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <button onClick={() => bulkUploadFileRef.current?.click()} disabled={isBulkUploading} className="bg-white/10 text-white px-8 py-4 rounded-full font-black uppercase italic text-sm tracking-wider hover:bg-white/20 transition-all shadow-xl flex items-center gap-3">
                    {isBulkUploading ? <Loader2 className="animate-spin" size={20} /> : <FileDown size={20} />} Ngarko CSV (Bulk)
                  </button>
                  <input type="file" accept=".csv" ref={bulkUploadFileRef} onChange={handleBulkUpload} className="hidden" />
                  <button onClick={() => setShowUpload(true)} className="bg-white text-black px-8 py-4 rounded-full font-black uppercase italic text-sm tracking-wider hover:bg-blue-600 hover:text-white transition-all shadow-xl flex items-center gap-3">
                    <Plus size={20} /> Shto Pjesë të Re
                  </button>
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {view === 'inventory' && (
              <div className="animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase">INVENTARI IM</h2>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={() => bulkUploadFileRef.current?.click()} disabled={isBulkUploading} className="bg-white/10 text-white p-3 rounded-xl hover:bg-white/20 transition-all">
                      {isBulkUploading ? <Loader2 className="animate-spin" size={20} /> : <FileDown size={20} />}
                    </button>
                    <div className="relative w-full md:w-72">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16}/>
                      <input 
                        placeholder="Kërko në inventar..." 
                        value={inventorySearch}
                        onChange={e => setInventorySearch(e.target.value)}
                        className="w-full bg-[#111111] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-blue-600/50 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {myParts.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <Package size={48} className="mx-auto text-zinc-800 mb-4" />
                    <p className="text-zinc-500 font-black uppercase italic text-sm">Nuk keni asnjë pjesë të listuar.</p>
                    <button onClick={() => setShowUpload(true)} className="mt-6 bg-blue-600 px-6 py-3 rounded-full text-sm font-black uppercase italic">Shto Pjesën e Parë</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {myParts.filter(p => p.title.toLowerCase().includes(inventorySearch.toLowerCase()) || p.model?.toLowerCase().includes(inventorySearch.toLowerCase())).map(part => (
                      <div key={part.id} className="group bg-[#111111] border border-white/5 rounded-3xl overflow-hidden hover:border-blue-600/30 hover:scale-[1.02] transition-all duration-300 shadow-2xl">
                        <div className="aspect-square bg-black relative overflow-hidden">
                          {part.image_url ? (
                            <Image src={part.image_url} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-110 transition-transform duration-500" alt={part.title} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package size={48} className="text-zinc-800" /></div>
                          )}
                          <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md border ${
                            part.status === 'Active' ? 'bg-green-500/20 text-green-500 border-green-500/20' : 
                            part.status === 'Sold' ? 'bg-blue-500/20 text-blue-500 border-blue-500/20' : 
                            'bg-red-500/20 text-red-500 border-red-500/20'
                          }`}>
                            {part.status === 'Active' ? 'AKTIVE' : part.status === 'Sold' ? 'E SHITUR' : 'E FSHIRË / SKADUAR'}
                          </div>
                          <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-black italic">
                            {part.price}€
                          </div>
                        </div>
                        <div className="p-6">
                          <h3 className="text-lg font-black italic uppercase mb-1 line-clamp-1">{part.title}</h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2">{part.model} • {part.year}</p>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {part.oem_number && <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[9px] text-zinc-300 font-bold">OEM: {part.oem_number}</span>}
                            <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[9px] text-zinc-300 font-bold">GJENDJA: {part.condition || 'E Përdorur'}</span>
                            <span className={`px-2 py-1 rounded text-[9px] font-bold ${part.quantity && part.quantity > 0 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>Sasi: {part.quantity || 0}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-6">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                              <p className="text-[8px] text-zinc-600 font-black uppercase tracking-tighter">Shikime</p>
                              <p className="text-lg font-black italic">{part.views || 0}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                              <p className="text-[8px] text-zinc-600 font-black uppercase tracking-tighter">Interaktimi</p>
                              <p className="text-lg font-black italic text-green-500">{part.leads || 0}</p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {part.status === 'Active' ? (
                              <div className="flex flex-col w-full gap-3">
                                {/* Lead Action Prompt */}
                                {(part.leads || 0) > (part.leads_processed || 0) && (
                                  <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl animate-pulse">
                                    <p className="text-[9px] font-black uppercase text-blue-400 mb-3 text-center tracking-widest">Keni kontakte të reja! A u shit?</p>
                                    <div className="flex gap-2">
                                      <button onClick={() => confirmSale(part.id)} className="flex-1 bg-green-600 py-2 rounded-lg text-[9px] font-black uppercase italic hover:bg-green-500 transition-all">PO (SHITUR)</button>
                                      <button onClick={() => dismissLead(part.id, part.leads || 0)} className="flex-1 bg-white/5 border border-white/10 py-2 rounded-lg text-[9px] font-black uppercase italic hover:bg-white/10 transition-all">JO</button>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex gap-2">
                                  <button onClick={() => confirmSale(part.id)} className="flex-1 bg-green-600 py-3 rounded-xl text-[10px] font-black uppercase italic hover:bg-green-500 transition-all flex items-center justify-center gap-2">
                                    {confirmingSale === part.id ? <Loader2 size={14} className="animate-spin"/> : <Check size={14}/>} SHITUR
                                  </button>
                                  <button onClick={() => setEditingPart(part)} className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                                    <Edit2 size={16}/>
                                  </button>
                                  <button onClick={() => deletePart(part.id)} className="w-12 h-12 bg-red-600/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-all">
                                    <Trash2 size={16}/>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => relistPart(part.id)} className="w-full bg-blue-600 py-3 rounded-xl text-[10px] font-black uppercase italic hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
                                <RefreshCw size={14}/> RI-PUBLIKO (30 DITË)
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
                  <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-x-auto">
                    <table className="w-full text-left font-black italic uppercase min-w-[600px]">
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

            {/* Payments Tab */}
            {view === 'payments' && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-5xl md:text-6xl font-black italic mb-8 tracking-tighter uppercase">HISTORIA E PAGESAVE</h2>
                <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl mb-8 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Total i Shlyer</p>
                    <p className="text-4xl font-black italic text-green-500">{sellerData.total_paid}€</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Borxhi i Mbetur</p>
                    <p className="text-4xl font-black italic text-red-500">{sellerData.current_debt}€</p>
                  </div>
                </div>

                {payments.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <CreditCard size={48} className="mx-auto text-zinc-800 mb-4" />
                    <p className="text-zinc-500 font-black uppercase italic text-sm">Nuk keni asnjë pagesë të regjistruar ende.</p>
                  </div>
                ) : (
                  <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
                    <table className="w-full text-left font-black italic uppercase">
                      <thead className="bg-white/5 text-[10px] text-zinc-500 tracking-wider">
                        <tr>
                          <th className="p-6">Data</th>
                          <th className="p-6">Përshkrimi</th>
                          <th className="p-6 text-center">Metoda</th>
                          <th className="p-6 text-right">Shuma</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {payments.map(p => (
                          <tr key={p.id} className="hover:bg-white/5 transition-all">
                            <td className="p-6 text-sm text-zinc-400">{new Date(p.date || p.created_at).toLocaleDateString()}</td>
                            <td className="p-6 text-sm">Pagesë Abonimi / Komisioni</td>
                            <td className="p-6 text-center">
                              <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-[8px]">{p.method || 'Cash/Bank'}</span>
                            </td>
                            <td className="p-6 text-right text-xl text-green-500">+{p.amount}€</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {view === 'profile' && (
              <div className="max-w-4xl animate-in slide-in-from-left-4 duration-500">
                <h2 className="text-5xl md:text-6xl font-black italic mb-8 tracking-tighter">PROFILI I BIZNESIT</h2>
                <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl space-y-6">
                  {editMode ? (
                    <>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div><label className="text-[10px] font-black uppercase text-zinc-500">Emri i Biznesit</label><input value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white mt-1" /></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-500">WhatsApp/Telefon</label><input value={editForm.phone} onChange={e=>setEditForm({...editForm, phone:e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white mt-1" /></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-500">Qyteti</label><input value={editForm.city} onChange={e=>setEditForm({...editForm, city:e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white mt-1" /></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-500">Adresa (E detajuar)</label><input value={editForm.address} onChange={e=>setEditForm({...editForm, address:e.target.value})} placeholder="Psh: Autostrada Tiranë-Durrës, Km 5" className="w-full bg-black border border-white/10 rounded-xl p-4 text-white mt-1" /></div>
                        <div><label className="text-[10px] font-black uppercase text-zinc-500">NIPT</label><input value={editForm.nipt} onChange={e=>setEditForm({...editForm, nipt:e.target.value})} className="w-full bg-black border border-white/10 rounded-xl p-4 text-white mt-1" /></div>
                      </div>
                      <div className="flex gap-4 pt-4"><button onClick={updateProfile} className="bg-green-600 px-8 py-3 rounded-xl font-black uppercase text-sm flex items-center gap-2"><Save size={16}/> Ruaj Ndryshimet</button><button onClick={()=>setEditMode(false)} className="bg-white/10 px-8 py-3 rounded-xl">Anulo</button></div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div><p className="text-[10px] font-black uppercase text-zinc-500">Emri i Biznesit</p><p className="text-white font-bold text-lg">{sellerData.name}</p></div>
                        <div><p className="text-[10px] font-black uppercase text-zinc-500">Email</p><p className="text-white">{sellerData.email}</p></div>
                        <div><p className="text-[10px] font-black uppercase text-zinc-500">WhatsApp/Telefon</p><p className="text-white">{sellerData.phone || '-'}</p></div>
                        <div><p className="text-[10px] font-black uppercase text-zinc-500">Qyteti</p><p className="text-white">{sellerData.city || '-'}</p></div>
                        <div><p className="text-[10px] font-black uppercase text-zinc-500">Adresa</p><p className="text-white">{sellerData.address || '-'}</p></div>
                        <div><p className="text-[10px] font-black uppercase text-zinc-500">NIPT</p><p className="text-white">{sellerData.nipt || '-'}</p></div>
                      </div>
                      <div className="border-t border-white/5 pt-4">
                        <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Licencë Biznesi (e detyrueshme)</p>
                        {sellerData.business_license ? (
                          <div className="flex items-center gap-3">
                            <button onClick={openLicense} className="text-blue-500 text-sm underline">Shiko licencën</button>
                            <button onClick={() => licenseInputRef.current?.click()} className="bg-white/10 px-4 py-2 rounded-xl text-xs">Ndrysho</button>
                          </div>
                        ) : (
                          <button onClick={() => licenseInputRef.current?.click()} className="bg-white/10 px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                            {uploadingLicense ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14}/>} Ngarko Licencën
                          </button>
                        )}
                        <input type="file" ref={licenseInputRef} onChange={handleLicenseUpload} className="hidden" accept="image/*,application/pdf" />
                        {sellerData.license_verified && <p className="text-green-500 text-[9px] mt-1">✓ Licenca e verifikuar</p>}
                        {!sellerData.license_verified && sellerData.business_license && (
                          <p className="text-yellow-500 text-[9px] mt-1">⏳ Në pritje të verifikimit nga administratori</p>
                        )}
                      </div>
                      <div className="border-t border-white/5 pt-4 flex flex-wrap justify-between items-center gap-4">
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
                    <h3 className="text-lg font-black italic mb-2 text-red-500">Kërkesë për Fshirje</h3>
                    <p className="text-xs text-zinc-500 mb-4">Ky veprim do të dërgojë një kërkesë te administratori për fshirjen e llogarisë tuaj.</p>
                    <button onClick={() => setShowDeleteModal(true)} className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-6 py-3 rounded-xl font-black uppercase text-sm transition-all flex items-center gap-2">
                      <Trash2 size={16}/> Dërgo Kërkesën
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
            <h3 className="text-xl font-black uppercase text-red-500">Dërgo Kërkesë Fshirjeje</h3>
            <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}><X size={20} /></button>
          </div>
          <p className="text-sm text-zinc-400 mb-4">Duke dërguar këtë kërkesë, ju njoftoni administratorin se dëshironi të fshini llogarinë tuaj përgjithmonë.</p>
          <p className="text-xs text-zinc-500 mb-2">Shkruani <span className="font-bold text-red-500">FSHIJE</span> për të konfirmuar:</p>
          <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="FSHIJE" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white mb-4" />
          <button onClick={handleDeleteAccount} disabled={deletingAccount} className="w-full bg-red-600 py-3 rounded-xl font-black uppercase text-sm disabled:opacity-50">
            {deletingAccount ? 'Duke dërguar...' : 'Dërgo Kërkesën'}
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
            <form onSubmit={handleUpload} className="space-y-6">
              <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 relative overflow-hidden border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-600/50 transition-all">
                {previewUrl ? <Image src={previewUrl} fill sizes="300px" className="object-cover rounded-2xl" alt="Preview" /> : <><Upload size={32} className="text-zinc-600"/><p className="text-[10px] mt-2">Kliko për të ngarkuar foton</p></>}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Emri i Pjesës*" value={newPart.title} onChange={e=>setNewPart({...newPart, title:e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-4 text-white" required />
                <input placeholder="Çmimi (€)*" type="number" value={newPart.price} onChange={e=>setNewPart({...newPart, price:e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-4 text-white" required />
                <input placeholder="Numri OEM" value={newPart.oem_number} onChange={e=>setNewPart({...newPart, oem_number:e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-4 text-white" />
                <input placeholder="Sasia" type="number" min="1" value={newPart.quantity} onChange={e=>setNewPart({...newPart, quantity:e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-4 text-white" />
                <select value={newPart.condition} onChange={e=>setNewPart({...newPart, condition:e.target.value})} className="bg-[#111] border border-white/10 rounded-xl p-4 text-white">
                  <option value="E Përdorur">E Përdorur</option>
                  <option value="E Re">E Re</option>
                  <option value="Për Pjesë">Për Pjesë (Me Defekt)</option>
                </select>
                <input placeholder="Modeli" value={newPart.model} onChange={e=>setNewPart({...newPart, model:e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-4 text-white" />
                <input placeholder="Viti" value={newPart.year} onChange={e=>setNewPart({...newPart, year:e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-4 text-white" />
                <input placeholder="Kategoria" value={newPart.category} onChange={e=>setNewPart({...newPart, category:e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-4 text-white" />
                <textarea placeholder="Përshkrimi" rows={3} value={newPart.description} onChange={e=>setNewPart({...newPart, description:e.target.value})} className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-4 text-white resize-none" />
              </div>
              <button type="submit" className="w-full bg-green-600 py-4 rounded-xl font-black uppercase italic text-sm hover:bg-green-500 transition-all">
                PUBLIKO PJESËN
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {editingPart && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 backdrop-blur-xl bg-black/80">
          <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-2xl rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setEditingPart(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={24}/></button>
            <h2 className="text-3xl font-black italic mb-6 uppercase">Ndrysho Detajet</h2>
            <form onSubmit={handleEditPart} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 tracking-widest">Titulli i Pjesës</label>
                  <input placeholder="Emri i Pjesës*" value={editingPart.title} onChange={e=>setEditingPart({...editingPart, title:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500/50 outline-none transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 tracking-widest">Çmimi (€)</label>
                  <input placeholder="Çmimi (€)*" type="number" value={editingPart.price} onChange={e=>setEditingPart({...editingPart, price: parseFloat(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500/50 outline-none transition-all" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 tracking-widest">Numri OEM</label>
                  <input placeholder="Numri OEM" value={editingPart.oem_number || ''} onChange={e=>setEditingPart({...editingPart, oem_number: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500/50 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 tracking-widest">Sasia</label>
                  <input placeholder="Sasia" type="number" min="1" value={editingPart.quantity || 1} onChange={e=>setEditingPart({...editingPart, quantity: parseInt(e.target.value) || 1})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500/50 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 tracking-widest">Gjendja</label>
                  <select value={editingPart.condition || 'E Përdorur'} onChange={e=>setEditingPart({...editingPart, condition: e.target.value})} className="w-full bg-[#111] border border-white/10 rounded-xl p-4 text-white focus:border-blue-500/50 outline-none transition-all">
                    <option value="E Përdorur">E Përdorur</option>
                    <option value="E Re">E Re</option>
                    <option value="Për Pjesë">Për Pjesë (Me Defekt)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 tracking-widest">Modeli</label>
                  <input placeholder="Modeli" value={editingPart.model} onChange={e=>setEditingPart({...editingPart, model:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500/50 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 tracking-widest">Viti</label>
                  <input placeholder="Viti" value={editingPart.year} onChange={e=>setEditingPart({...editingPart, year: parseInt(e.target.value) || 0})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500/50 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 tracking-widest">Kategoria</label>
                  <input placeholder="Kategoria" value={editingPart.category} onChange={e=>setEditingPart({...editingPart, category:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500/50 outline-none transition-all" />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-600 ml-1 tracking-widest">Përshkrimi</label>
                  <textarea placeholder="Përshkrimi" rows={4} value={editingPart.description} onChange={e=>setEditingPart({...editingPart, description:e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white resize-none focus:border-blue-500/50 outline-none transition-all" />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-blue-600 py-4 rounded-xl font-black uppercase italic text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
                  RUAJ NDRYSHIMET
                </button>
                <button type="button" onClick={() => setEditingPart(null)} className="px-8 bg-white/5 py-4 rounded-xl font-black uppercase italic text-sm hover:bg-white/10 transition-all">
                  ANULO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}