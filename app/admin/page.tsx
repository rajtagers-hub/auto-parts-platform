"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  Users, Package, Shield, LayoutDashboard, LogOut,
  CheckCircle, BadgeCheck, CreditCard, Trash2,
  ChevronDown, Search, RefreshCw, Pencil, Download, FileDown,
  UserCircle, AlertTriangle, Menu, X, Key, Eye, ShieldAlert
} from "lucide-react";
import EditUserModal from "./components/EditUserModal";
import { downloadUserRevenueCSV, downloadSingleUserRevenueCSV } from "./components/RevenueDownload";
import { downloadAllUsersPDF, downloadSingleUserPDF } from "./components/RevenuePDF";

type Tab = "overview" | "users" | "parts" | "security" | "requests" | "profile";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletionRequests, setDeletionRequests] = useState<any[]>([]);
  const [adminProfile, setAdminProfile] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<any | null>(null);
  const [newAdminPassword, setNewAdminPassword] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    const [usersRes, partsRes] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("parts").select("*, users!seller_id(name)").order("created_at", { ascending: false }),
    ]);
    setUsers(usersRes.data || []);
    setParts(partsRes.data || []);
    // Fetch deletion requests
    try {
      const res = await fetch("/api/admin/deletion-requests");
      if (res.ok) setDeletionRequests(await res.json());
    } catch { /* ignore */ }
    // Fetch admin profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
      setAdminProfile(profile);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "Active" ? "Suspended" : "Active";
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      showToast(`Përdoruesi u ${newStatus === "Active" ? "aktivizua" : "pezullua"} me sukses`);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyLicense = async (userId: string) => {
    setActionLoading(`verify-${userId}`);
    try {
      const { error } = await supabase.from("users").update({ license_verified: true }).eq("id", userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, license_verified: true } : u));
      showToast("Licensa u verifikua me sukses");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePart = async (partId: string) => {
    if (!confirm("Jeni i sigurt që doni të fshini këtë pjesë?")) return;
    setActionLoading(`part-${partId}`);
    try {
      const { error } = await supabase.from("parts").update({ status: "Deleted" }).eq("id", partId);
      if (error) throw error;
      setParts(prev => prev.map(p => p.id === partId ? { ...p, status: "Deleted" } : p));
      showToast("Pjesa u fshi me sukses");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprovePart = async (partId: string) => {
    setActionLoading(`part-${partId}`);
    try {
      const { error } = await supabase.from("parts").update({ status: "Active" }).eq("id", partId);
      if (error) throw error;
      setParts(prev => prev.map(p => p.id === partId ? { ...p, status: "Active" } : p));
      showToast("Pjesa u aprovua me sukses");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveUser = async (updatedUser: any) => {
    setActionLoading(`edit-${updatedUser.id}`);
    try {
      const { id, created_at, ...updateData } = updatedUser;
      const { error } = await supabase.from("users").update(updateData).eq("id", id);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === id ? updatedUser : u));
      setEditingUser(null);
      showToast("Përdoruesi u ndryshua me sukses");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Jeni i sigurt që doni të fshini këtë përdorues përgjithmonë?")) return;
    setActionLoading(`delete-${userId}`);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setDeletionRequests(prev => prev.filter(r => r.user_id !== userId));
      showToast("Përdoruesi u fshi përgjithmonë");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resettingPasswordUser || !newAdminPassword) return;
    setActionLoading(`reset-${resettingPasswordUser.id}`);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resettingPasswordUser.id, newPassword: newAdminPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast("Fjalëkalimi u rivendos me sukses");
      setResettingPasswordUser(null);
      setNewAdminPassword("");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDeletion = async (requestId: string) => {
    try {
      await supabase.from("deletion_requests").update({ status: "rejected" }).eq("id", requestId);
      setDeletionRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "rejected" } : r));
      showToast("Kërkesa u refuzua");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Stats (Focus only on Graveyard users)
  const businessUsers = users.filter(u => u.user_type === "Graveyard");
  const totalUsers = businessUsers.length;
  const activeUsers = businessUsers.filter(u => u.status === "Active").length;
  const suspendedUsers = businessUsers.filter(u => u.status === "Suspended").length;
  const totalParts = parts.length;
  const activeParts = parts.filter(p => p.status === "Active").length;
  const graveyardUsers = businessUsers.length;
  
  const totalPlatformDebt = businessUsers.reduce((acc, u) => acc + (u.current_debt || 0), 0);
  const overdueUsers = businessUsers.filter(u => (u.current_debt || 0) > 0).sort((a,b) => (b.current_debt || 0) - (a.current_debt || 0));

  // Filtered data (Excluding individuals)
  const filteredUsers = businessUsers.filter(u => {
    const matchesSearch = (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredParts = parts.filter(p =>
    (p.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingRequests = deletionRequests.filter(r => r.status === "pending");

  const tabs = [
    { id: "overview" as Tab, label: "Përmbledhje", icon: LayoutDashboard },
    { id: "users" as Tab, label: "Përdoruesit", icon: Users },
    { id: "parts" as Tab, label: "Pjesët", icon: Package },
    { id: "requests" as Tab, label: `Kërkesat${pendingRequests.length ? ` (${pendingRequests.length})` : ""}`, icon: AlertTriangle },
    { id: "security" as Tab, label: "Siguria", icon: Shield },
    { id: "profile" as Tab, label: "Profili", icon: UserCircle },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold">Duke ngarkuar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl border text-sm font-bold uppercase tracking-wider transition-all animate-pulse ${
          toast.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#0A0A0A] border-b border-white/5 sticky top-0 z-50">
        <h1 className="text-lg font-black italic uppercase tracking-wider">VEKTRA</h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar - Desktop & Mobile */}
      <div className={`
        fixed left-0 top-0 bottom-0 w-64 bg-[#0A0A0A] border-r border-white/5 flex flex-col z-40 transition-transform duration-300
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-6 border-b border-white/5 hidden lg:block">
          <h1 className="text-lg font-black italic uppercase tracking-wider">VEKTRA</h1>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { 
                setActiveTab(tab.id); 
                setSearchQuery(""); 
                setStatusFilter("all");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/10 transition-all">
            <LogOut className="w-4 h-4" />
            Dil
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-64 p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight">
              {tabs.find(t => t.id === activeTab)?.label}
            </h2>
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold mt-1">
              Paneli i administrimit
            </p>
          </div>
          <button onClick={fetchData} className="w-fit flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all text-[10px] font-bold uppercase tracking-wider">
            <RefreshCw className="w-3 h-3" /> Rifresko
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Përdorues", value: totalUsers, color: "blue", icon: Users },
                  { label: "Aktiv", value: activeUsers, color: "emerald", icon: CheckCircle },
                  { label: "Borxhi Total", value: `${totalPlatformDebt.toFixed(0)}€`, color: "yellow", icon: CreditCard },
                  { label: "Total Pjesë", value: totalParts, color: "purple", icon: Package },
                ].map((stat, i) => (
                  <div key={i} className={`bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 hover:border-${stat.color}-500/20 transition-all group`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">{stat.label}</span>
                      <stat.icon className={`w-4 h-4 text-${stat.color}-500 opacity-50 group-hover:opacity-100 transition-opacity`} />
                    </div>
                    <p className={`text-4xl font-black italic ${stat.color === 'yellow' ? 'text-yellow-500' : ''}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Billing Cycle Reminders */}
              <div className="bg-[#0A0A0A] border border-yellow-500/10 rounded-2xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-yellow-500">Ciklet e Pagesave</h3>
                    <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold mt-1">Përdoruesit me pagesa të prapambetura</p>
                  </div>
                  <div className="bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {overdueUsers.length} ALERT
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {overdueUsers.length === 0 ? (
                    <div className="col-span-full py-10 text-center border border-dashed border-white/5 rounded-2xl">
                      <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest italic">Nuk ka pagesa të prapambetura</p>
                    </div>
                  ) : (
                    overdueUsers.slice(0, 6).map(user => (
                      <div key={user.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-yellow-500/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-black text-sm uppercase italic">{user.name}</p>
                            <p className="text-zinc-600 text-[9px] uppercase tracking-wider">{user.city || 'Qytet i panjohur'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black text-yellow-500">{user.current_debt}€</p>
                            <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-tighter">BORXHI AKTUAL</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Cikli i prapambetur</span>
                          </div>
                          <button 
                            onClick={() => {
                              setActiveTab('users');
                              setSearchQuery(user.email);
                            }}
                            className="text-[9px] font-black text-blue-500 uppercase hover:text-white transition-colors"
                          >
                            Detaje
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            {/* Recent Users */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4">Përdoruesit e Fundit</h3>
              <div className="space-y-3">
                {users.slice(0, 5).map(user => (
                  <div key={user.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div>
                      <p className="font-bold text-sm">{user.name || "Pa emër"}</p>
                      <p className="text-zinc-600 text-xs">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{user.user_type}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        user.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>{user.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Parts */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4">Pjesët e Fundit</h3>
              <div className="space-y-3">
                {parts.slice(0, 5).map(part => (
                  <div key={part.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-4">
                      {part.image_url && (
                        <img src={part.image_url} alt={part.title} className="w-10 h-10 rounded-lg object-cover bg-zinc-900" />
                      )}
                      <div>
                        <p className="font-bold text-sm">{part.title}</p>
                        <p className="text-zinc-600 text-xs">{part.users?.name || "Pa shitës"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm">{part.price}€</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                        part.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>{part.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  placeholder="Kërko përdorues..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-blue-500/50 outline-none transition-colors"
                />
              </div>
              <div className="flex gap-4">
                <div className="relative flex-1 md:flex-none">
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm appearance-none pr-10 focus:border-blue-500/50 outline-none transition-colors"
                  >
                    <option value="all">Të gjithë</option>
                    <option value="Active">Aktiv</option>
                    <option value="Suspended">Pezulluar</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadUserRevenueCSV(users, parts)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                  >
                    <FileDown className="w-4 h-4" /> CSV
                  </button>
                  <button
                    onClick={() => downloadAllUsersPDF(users, parts)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                  >
                    <FileDown className="w-4 h-4" /> PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Biznesi", "Verifikimi", "Licenca", "Borxhi", "Statusi", "Adresa", "Veprime"].map(h => (
                      <th key={h} className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-6 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-sm font-black italic shadow-lg shadow-blue-600/20">
                            {(user.name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-sm uppercase italic">{user.name || "Pa emër"}</p>
                            <p className="text-zinc-600 text-[10px] lowercase">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-6">
                        {user.license_verified ? (
                          <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
                            <BadgeCheck size={12}/>
                            <span className="text-[9px] font-black uppercase tracking-widest">Verifikuar</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full w-fit">
                            <ShieldAlert size={12}/>
                            <span className="text-[9px] font-black uppercase tracking-widest">Në Pritje</span>
                          </div>
                        )}
                      </td>
                      <td className="py-6 px-6">
                        {user.business_license ? (
                          <a 
                            href={user.business_license} 
                            target="_blank" 
                            className="flex items-center gap-2 text-blue-400 hover:text-white transition-colors group"
                          >
                            <div className="p-2 bg-blue-600/10 rounded-lg group-hover:bg-blue-600/20">
                              <Eye size={14}/>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Shiko</span>
                          </a>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700 italic">Pa Ngarkuar</span>
                        )}
                      </td>
                      <td className="py-6 px-6">
                        <div className="flex flex-col">
                          <span className={`font-black text-sm ${user.current_debt > 0 ? "text-yellow-500" : "text-emerald-500"}`}>
                            {user.current_debt || 0}€
                          </span>
                          <span className="text-[8px] font-black uppercase text-zinc-700 tracking-tighter">Pagesa Mujore</span>
                        </div>
                      </td>
                      <td className="py-6 px-6">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                          user.status === "Active" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>{user.status}</span>
                      </td>
                      <td className="py-6 px-6">
                        <div className="max-w-[150px]">
                          <p className="text-[10px] font-bold text-zinc-400 truncate uppercase tracking-tighter">{user.address || "—"}</p>
                          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{user.city}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setResettingPasswordUser(user)}
                            className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all"
                            title="Ndrysho Fjalëkalimin"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="p-1.5 rounded-lg bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                            title="Ndrysho"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => downloadSingleUserRevenueCSV(user, parts)}
                            className="p-1.5 rounded-lg bg-white/5 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                            title="Shkarko CSV"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => downloadSingleUserPDF(user, parts)}
                            className="p-1.5 rounded-lg bg-white/5 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                            title="Shkarko PDF"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStatusToggle(user.id, user.status)}
                            disabled={actionLoading === user.id}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 ${
                              user.status === "Active"
                                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            }`}
                          >
                            {actionLoading === user.id ? "..." : user.status === "Active" ? "Pezullo" : "Aktivizo"}
                          </button>
                          {user.user_type === "Graveyard" && !user.license_verified && (
                            <button
                              onClick={() => handleVerifyLicense(user.id)}
                              disabled={actionLoading === `verify-${user.id}`}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50"
                            >
                              <BadgeCheck className="w-3 h-3 inline mr-1" />
                              {actionLoading === `verify-${user.id}` ? "..." : "Verifiko"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={actionLoading === `delete-${user.id}`}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                            title="Fshij Përdoruesin"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-zinc-600 text-sm">Asnjë përdorues nuk u gjet.</div>
              )}
            </div>
          </div>
        )}

        {/* PARTS TAB */}
        {activeTab === "parts" && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                placeholder="Kërko pjesë..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-blue-500/50 outline-none transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredParts.map(part => (
                <div key={part.id} className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all group">
                  {part.image_url ? (
                    <img src={part.image_url} alt={part.title} className="w-full h-40 object-cover bg-zinc-900" />
                  ) : (
                    <div className="w-full h-40 bg-zinc-900 flex items-center justify-center">
                      <Package className="w-8 h-8 text-zinc-700" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-sm flex-1 mr-2">{part.title}</h3>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full shrink-0 ${
                        part.status === "Active" ? "bg-emerald-500/10 text-emerald-400"
                          : part.status === "Deleted" ? "bg-red-500/10 text-red-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}>{part.status}</span>
                    </div>
                    <p className="text-zinc-600 text-xs mb-1">{part.users?.name || "Pa shitës"}</p>
                    <p className="text-zinc-600 text-xs mb-3">{part.model} • {part.year}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black">{part.price}€</span>
                      <div className="flex gap-2">
                        {part.status !== "Active" && (
                          <button
                            onClick={() => handleApprovePart(part.id)}
                            disabled={actionLoading === `part-${part.id}`}
                            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {part.status !== "Deleted" && (
                          <button
                            onClick={() => handleDeletePart(part.id)}
                            disabled={actionLoading === `part-${part.id}`}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredParts.length === 0 && (
              <div className="py-12 text-center text-zinc-600 text-sm">Asnjë pjesë nuk u gjet.</div>
            )}
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && <SecurityPanel showToast={showToast} />}

        {/* REQUESTS TAB */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Përdoruesi", "Email", "Data", "Statusi", "Veprime"].map(h => (
                      <th key={h} className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deletionRequests.map(req => (
                    <tr key={req.id} className="border-b border-white/5">
                      <td className="py-4 px-6 font-bold text-sm">{req.users?.name || "Pa emër"}</td>
                      <td className="py-4 px-6 text-zinc-400 text-sm">{req.users?.email}</td>
                      <td className="py-4 px-6 text-zinc-400 text-sm">
                        {new Date(req.created_at).toLocaleDateString("sq-AL")}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                          req.status === "pending" ? "bg-yellow-500/10 text-yellow-400"
                          : req.status === "rejected" ? "bg-red-500/10 text-red-400"
                          : "bg-emerald-500/10 text-emerald-400"
                        }`}>{req.status}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          {req.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleDeleteUser(req.user_id)}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-600 text-white hover:bg-red-500 transition-all"
                              >
                                Aprovo Fshirjen
                              </button>
                              <button
                                onClick={() => handleRejectDeletion(req.id)}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white/5 text-zinc-400 hover:bg-white/10 transition-all"
                              >
                                Refuzo
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {deletionRequests.length === 0 && (
                <div className="py-12 text-center text-zinc-600 text-sm">Asnjë kërkesë për fshirje.</div>
              )}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === "profile" && adminProfile && (
          <ProfilePanel profile={adminProfile} showToast={showToast} setProfile={setAdminProfile} />
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}

      {/* Reset Password Modal */}
      {resettingPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-black/80">
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black uppercase italic mb-2 text-yellow-500">Reset Password</h3>
            <p className="text-zinc-600 text-[10px] mb-6 font-black uppercase tracking-widest">
              Për përdoruesin: <span className="text-white">{resettingPasswordUser.name || resettingPasswordUser.email}</span>
            </p>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-600 ml-1">Fjalëkalimi i Ri</label>
                <input 
                  type="text" 
                  placeholder="Shkruaj fjalëkalimin..." 
                  value={newAdminPassword}
                  onChange={e => setNewAdminPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500/50 outline-none transition-all"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button 
                  onClick={handleResetPassword}
                  disabled={actionLoading?.startsWith('reset-')}
                  className="flex-1 bg-blue-600 py-4 rounded-xl font-black uppercase italic text-sm hover:bg-blue-500 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20"
                >
                  {actionLoading?.startsWith('reset-') ? 'Duke u ruajtur...' : 'RUAJ NDRYSHIMIN'}
                </button>
                <button 
                  onClick={() => { setResettingPasswordUser(null); setNewAdminPassword(""); }}
                  className="px-8 bg-white/5 py-4 rounded-xl font-black uppercase italic text-sm hover:bg-white/10 transition-all"
                >
                  ANULO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================== SECURITY PANEL ======================== */
function SecurityPanel({ showToast }: { showToast: (msg: string, type?: "success" | "error") => void }) {
  const [settings, setSettings] = useState({
    sessionTimeout: 30,
    autoSuspendDebtDays: 30,
    autoHideListingsOnDebt: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { getSecuritySettings } = await import("@/app/actions/admin");
        const data = await getSecuritySettings();
        setSettings({
          sessionTimeout: data.sessionTimeout,
          autoSuspendDebtDays: data.autoSuspendDebtDays,
          autoHideListingsOnDebt: data.autoHideListingsOnDebt,
        });
      } catch { /* use defaults */ }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { updateSecuritySettings } = await import("@/app/actions/admin");
      await updateSecuritySettings(settings);
      showToast("Cilësimet u ruajtën me sukses");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest mb-2">Cilësimet e Sesionit</h3>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">
            Timeout i Sesionit (minuta)
          </label>
          <input
            type="number"
            value={settings.sessionTimeout}
            onChange={e => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest mb-2">Menaxhimi i Borxhit</h3>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">
            Pezullim automatik pas ditëve me borxh
          </label>
          <input
            type="number"
            value={settings.autoSuspendDebtDays}
            onChange={e => setSettings({ ...settings, autoSuspendDebtDays: Number(e.target.value) })}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-bold text-sm">Fshih listimet kur ka borxh</p>
            <p className="text-zinc-600 text-xs mt-1">Automatikisht fshih pjesët kur përdoruesi ka borxh</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, autoHideListingsOnDebt: !settings.autoHideListingsOnDebt })}
            className={`w-12 h-6 rounded-full transition-all relative ${
              settings.autoHideListingsOnDebt ? "bg-blue-600" : "bg-zinc-700"
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
              settings.autoHideListingsOnDebt ? "left-6" : "left-0.5"
            }`} />
          </button>
        </div>
      </div>

      {/* Change Admin Password Section */}
      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest mb-2">Siguria e Llogarisë Sime</h3>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">
            Fjalëkalimi i Ri
          </label>
          <input
            type="password"
            id="admin_new_password"
            placeholder="Shkruani fjalëkalimin e ri"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        <button
          onClick={async () => {
            const pwd = (document.getElementById('admin_new_password') as HTMLInputElement).value;
            if (!pwd || pwd.length < 6) return showToast("Fjalëkalimi duhet të jetë të paktën 6 karaktere", "error");
            const { error } = await supabase.auth.updateUser({ password: pwd });
            if (error) showToast(error.message, "error");
            else {
              showToast("Fjalëkalimi u ndryshua me sukses");
              (document.getElementById('admin_new_password') as HTMLInputElement).value = "";
            }
          }}
          className="w-full bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/10"
        >
          Ndrysho Fjalëkalimin Tim
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-white text-black py-4 rounded-xl font-black uppercase italic text-xs tracking-widest hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
      >
        {saving ? "Duke u ruajtur..." : "RUAJ TË GJITHA CILËSIMET"}
      </button>
    </div>
  );
function ProfilePanel({ profile, showToast, setProfile }: { profile: any, showToast: any, setProfile: any }) {
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

      // Also update auth email if changed
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
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Telefon</label>
            <input
              type="text"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Qyteti</label>
            <input
              type="text"
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>
        <button
          onClick={handleUpdateProfile}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black uppercase italic tracking-wider transition-all disabled:opacity-50"
        >
          {saving ? "Duke ruajtur..." : "Përditëso Profilin"}
        </button>
      </div>
    </div>
  );
}