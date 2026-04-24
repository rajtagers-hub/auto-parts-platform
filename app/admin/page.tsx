"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  ShieldCheck, Users, HardDrive, BarChart3, Search, MoreVertical,
  UserPlus, Ban, CheckCircle2, TrendingUp, Wallet, ArrowUpRight,
  Lock, LogOut, Zap, X, AlertTriangle, ChevronLeft, ChevronRight,
  Calendar, Trash2, Edit3, Flag, Bell, User, Key,
  Send, Car, Shield, Eye, EyeOff, DollarSign, FileText
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  getUsers,
  getParts,
  getSecuritySettings,
  updateUserStatus,
  verifyUserLicense,
  markDebtPaid,
  updateSecuritySettings,
  updatePartStatus
} from "@/app/actions/admin";

// --- TYPES ---
type UserType = "Graveyard" | "Individual" | "Admin";
type UserStatus = "Active" | "Suspended" | "Blocked" | "Pending";
type Plan = "Free" | "Premium" | "Enterprise";

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  status: UserStatus;
  plan: Plan;
  totalListings: number;
  totalPaid: number;
  currentDebt: number;
  lastPaymentDate: string;
  joinDate: string;
  businessLicense?: string;
  licenseVerified?: boolean;
  phone?: string;
  city?: string;
}

interface Part {
  id: string;
  title: string;
  price: number;
  sellerId: string;
  sellerName: string;
  condition: string;
  status: "Active" | "Flagged" | "Deleted" | "Hidden";
  createdAt: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  level: "info" | "warn" | "error";
  ip?: string;
}

interface SecuritySettings {
  mfaRequired: boolean;
  sessionTimeout: number;
  ipWhitelist: string[];
  blockedIPs: string[];
  autoSuspendDebtDays: number;
  autoHideListingsOnDebt: boolean;
}

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: "default" | "error" | "success";
}

const mockAnalyticsData = [
  { month: "Jan", revenue: 4200, users: 98, listings: 3120 },
  { month: "Feb", revenue: 5100, users: 105, listings: 3450 },
  { month: "Mar", revenue: 5900, users: 118, listings: 3700 },
  { month: "Apr", revenue: 7200, users: 124, listings: 3840 },
];

// --- Helper Components ---
interface NavBtnProps { label: string; icon: React.ElementType; active: boolean; onClick: () => void; }
function NavBtn({ label, icon: Icon, active, onClick }: NavBtnProps) {
  return (
    <button onClick={onClick} className={`w-full flex items-center px-6 py-4 rounded-2xl font-black italic uppercase text-[11px] tracking-widest transition-all ${active ? "bg-[#D4AF37] text-black shadow-lg" : "text-zinc-500 hover:bg-white/5 hover:text-white"}`}>
      <Icon size={18} className="mr-4" /> {label}
    </button>
  );
}

interface StatCardProps { label: string; val: string | number; icon: React.ElementType; trend?: string; }
function StatCard({ label, val, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-2xl hover:border-[#D4AF37]/30">
      <div className="flex justify-between items-start mb-4"><div className="p-3 bg-white/5 rounded-xl"><Icon size={20} className="text-[#D4AF37]" /></div>{trend && <span className="text-green-500 text-xs flex items-center"><ArrowUpRight size={12}/> {trend}</span>}</div>
      <p className="text-[10px] font-black text-zinc-600 uppercase">{label}</p>
      <p className="text-3xl font-black italic text-white mt-1">{val}</p>
    </div>
  );
}

interface FilterChipProps { label: string; active: boolean; onClick: () => void; }
function FilterChip({ label, active, onClick }: FilterChipProps) {
  return <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase italic ${active ? "bg-[#D4AF37] text-black" : "bg-white/5 text-zinc-400 hover:bg-white/10"}`}>{label}</button>;
}

interface ToastMessageProps { toast: Toast; }
function ToastMessage({ toast }: ToastMessageProps) {
  return <div className={`p-4 rounded-xl shadow-lg border-l-4 ${toast.variant === "error" ? "bg-red-900/90 border-red-500" : toast.variant === "success" ? "bg-green-900/90 border-green-500" : "bg-zinc-800 border-[#D4AF37]"}`}><p className="text-sm font-bold text-white">{toast.title}</p>{toast.description && <p className="text-xs text-zinc-300">{toast.description}</p>}</div>;
}

// --- Analytics Tab (unchanged) ---
function AnalyticsTab({ users, parts }: { users: PlatformUser[]; parts: Part[] }) {
  const totalRevenue = users.reduce((sum, u) => sum + u.totalPaid, 0);
  const activeSellers = users.filter(u => u.status === "Active").length;
  const totalListings = parts.filter(p => p.status === "Active").length;
  const growth = "+12.5%";
  return (
    <div className="space-y-8">
      <div><h2 className="text-3xl font-black italic uppercase text-white">Analytics Dashboard</h2><p className="text-sm text-zinc-500">Platform performance, revenue trends.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Total Revenue" val={`€${totalRevenue}`} icon={Wallet} trend={growth} />
        <StatCard label="Active Sellers" val={activeSellers} icon={Users} />
        <StatCard label="Active Listings" val={totalListings} icon={Zap} />
        <StatCard label="Market Growth" val={growth} icon={TrendingUp} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0A0A0A] p-6 rounded-2xl"><h3 className="text-white font-bold mb-4">Revenue Trend (€)</h3><ResponsiveContainer width="100%" height={300}><LineChart data={mockAnalyticsData}><CartesianGrid strokeDasharray="3 3" stroke="#333" /><XAxis dataKey="month" stroke="#888" /><YAxis stroke="#888" /><Tooltip contentStyle={{ backgroundColor: "#111", borderColor: "#D4AF37" }} /><Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
        <div className="bg-[#0A0A0A] p-6 rounded-2xl"><h3 className="text-white font-bold mb-4">Users & Listings</h3><ResponsiveContainer width="100%" height={300}><BarChart data={mockAnalyticsData}><CartesianGrid strokeDasharray="3 3" stroke="#333" /><XAxis dataKey="month" stroke="#888" /><YAxis stroke="#888" /><Tooltip contentStyle={{ backgroundColor: "#111", borderColor: "#D4AF37" }} /><Legend /><Bar dataKey="users" fill="#D4AF37" /><Bar dataKey="listings" fill="#AA8419" /></BarChart></ResponsiveContainer></div>
      </div>
    </div>
  );
}

// --- User Management Tab (uses Server Actions) ---
interface UserManagementTabProps {
  users: PlatformUser[];
  setUsers: React.Dispatch<React.SetStateAction<PlatformUser[]>>;
  addToast: (toast: Omit<Toast, "id">) => void;
  securitySettings: SecuritySettings;
}
function UserManagementTab({ users, setUsers, addToast }: UserManagementTabProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"All" | UserStatus>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | UserType>("All");
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const pageSize = 5;

  const filtered = useMemo(() => {
    return users.filter(u =>
      (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter === "All" || u.status === statusFilter) &&
      (typeFilter === "All" || u.userType === typeFilter)
    );
  }, [users, search, statusFilter, typeFilter]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      await updateUserStatus(userId, newStatus);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      addToast({ title: `User ${newStatus}`, variant: "success" });
    } catch (err: any) {
      addToast({ title: err.message || "Error updating status", variant: "error" });
    }
  };

  const verifyLicense = async (userId: string) => {
    try {
      await verifyUserLicense(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, licenseVerified: true } : u));
      addToast({ title: "License verified", variant: "success" });
      setShowDetailsModal(false);
    } catch (err: any) {
      addToast({ title: err.message || "Verification failed", variant: "error" });
    }
  };

  const markDebtPaidHandler = async (userId: string, amount: number) => {
    try {
      await markDebtPaid(userId, amount);
      const user = users.find(u => u.id === userId);
      if (user) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, currentDebt: 0, totalPaid: u.totalPaid + amount, lastPaymentDate: new Date().toISOString().split('T')[0] } : u));
      }
      addToast({ title: "Debt marked as paid", variant: "success" });
      setShowPaymentModal(false);
    } catch (err: any) {
      addToast({ title: err.message || "Error", variant: "error" });
    }
  };

  const generateUserReport = async (user: PlatformUser) => {
    const { data: sales } = await supabase
      .from('parts')
      .select('title, price, created_at')
      .eq('seller_id', user.id)
      .eq('status', 'Sold')
      .order('created_at', { ascending: false });
    const { data: activeParts } = await supabase
      .from('parts')
      .select('title, price, views, created_at')
      .eq('seller_id', user.id)
      .eq('status', 'Active')
      .order('created_at', { ascending: false });
    const doc = new jsPDF();
    const reportDate = new Date().toLocaleDateString('sq-AL');
    doc.setFontSize(18);
    doc.text(`Raporti i Përdoruesit - ${user.name}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Email: ${user.email} | Tipi: ${user.userType} | Statusi: ${user.status}`, 14, 30);
    doc.text(`Data e raportit: ${reportDate}`, 14, 38);
    doc.text(`Borxhi aktual: ${user.currentDebt}€ | Total i paguar: ${user.totalPaid}€`, 14, 46);
    if (user.lastPaymentDate) doc.text(`Pagesa e fundit: ${user.lastPaymentDate}`, 14, 54);
    if (user.joinDate) doc.text(`U bashkua më: ${user.joinDate}`, 14, 62);
    let y = 72;
    if (sales && sales.length > 0) {
      doc.setFontSize(12);
      doc.text('Pjesë të Shitura', 14, y);
      y += 6;
      const salesData = sales.map(s => [s.title, new Date(s.created_at).toLocaleDateString(), `${s.price}€`, `${(s.price * 0.03).toFixed(2)}€`]);
      autoTable(doc, { startY: y, head: [['Produkti', 'Data', 'Çmimi', 'Komisioni']], body: salesData, theme: 'striped', headStyles: { fillColor: [59, 130, 246] }, margin: { left: 14 } });
      y = (doc as any).lastAutoTable.finalY + 10;
    }
    if (activeParts && activeParts.length > 0) {
      doc.setFontSize(12);
      doc.text('Pjesë Aktive', 14, y);
      y += 6;
      const partsData = activeParts.map(p => [p.title, `${p.price}€`, p.views || 0, new Date(p.created_at).toLocaleDateString()]);
      autoTable(doc, { startY: y, head: [['Produkti', 'Çmimi', 'Shikime', 'Data e krijimit']], body: partsData, theme: 'striped', headStyles: { fillColor: [59, 130, 246] }, margin: { left: 14 } });
    }
    doc.save(`raporti_${user.name.replace(/\s/g, '_')}_${reportDate.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-3xl font-black italic uppercase text-white">User Management</h2><p className="text-sm text-zinc-500">Manage sellers, view debts, verify licenses.</p></div>
        <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-6 text-sm text-white w-64"/></div>
      </div>
      <div className="flex gap-3 flex-wrap">
        <FilterChip label="All" active={statusFilter === "All"} onClick={() => setStatusFilter("All")}/>
        <FilterChip label="Active" active={statusFilter === "Active"} onClick={() => setStatusFilter("Active")}/>
        <FilterChip label="Suspended" active={statusFilter === "Suspended"} onClick={() => setStatusFilter("Suspended")}/>
        <FilterChip label="Blocked" active={statusFilter === "Blocked"} onClick={() => setStatusFilter("Blocked")}/>
        <FilterChip label="Graveyard" active={typeFilter === "Graveyard"} onClick={() => setTypeFilter("Graveyard")}/>
        <FilterChip label="Individual" active={typeFilter === "Individual"} onClick={() => setTypeFilter("Individual")}/>
      </div>
      <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-x-auto">
        <table className="w-full min-w-250">
          <thead className="bg-white/5 border-b border-white/5 text-[9px] font-black uppercase text-[#D4AF37]/60">
            <tr>
              <th className="px-6 py-5">User</th>
              <th className="px-6 py-5">Type</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Listings</th>
              <th className="px-6 py-5">Paid</th>
              <th className="px-6 py-5">Debt</th>
              <th className="px-6 py-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginated.map(user => (
              <tr key={user.id} className="hover:bg-white/5 cursor-pointer" onClick={() => { setSelectedUser(user); setShowDetailsModal(true); }}>
                <td className="px-6 py-5"><div><p className="font-bold text-white">{user.name}</p><p className="text-[9px] text-zinc-500">{user.email}</p></div></td>
                <td className="px-6 py-5"><span className={`text-[9px] font-black px-2 py-1 rounded ${user.userType === "Graveyard" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"}`}>{user.userType}</span></td>
                <td className="px-6 py-5"><span className={`px-2 py-1 rounded-full text-[8px] font-black ${user.status === "Active" ? "bg-green-500/10 text-green-500" : user.status === "Suspended" ? "bg-yellow-500/10 text-yellow-500" : user.status === "Blocked" ? "bg-red-500/10 text-red-500" : "bg-orange-500/10 text-orange-400"}`}>{user.status}</span></td>
                <td className="px-6 py-5 text-center text-white font-bold">{user.totalListings}</td>
                <td className="px-6 py-5 text-green-400 font-bold">€{user.totalPaid}</td>
                <td className={`px-6 py-5 font-bold ${user.currentDebt > 0 ? "text-red-400" : "text-zinc-500"}`}>€{user.currentDebt}</td>
                <td className="px-6 py-5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => generateUserReport(user)} className="text-blue-400 hover:text-white p-1.5 rounded-lg" title="Generate Report"><FileText size={16}/></button>
                  <button onClick={() => { setSelectedUser(user); setShowPaymentModal(true); }} className="text-[#D4AF37] hover:text-white"><DollarSign size={16}/></button>
                  <button onClick={() => handleStatusChange(user.id, user.status === "Active" ? "Suspended" : "Active")} className="text-yellow-500"><Ban size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between mt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 bg-white/5 rounded">Prev</button>
          <span>{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-white/5 rounded">Next</button>
        </div>
      )}
      {showDetailsModal && selectedUser && <UserDetailsModal user={selectedUser} onClose={() => setShowDetailsModal(false)} onVerifyLicense={verifyLicense} addToast={addToast} />}
      {showPaymentModal && selectedUser && <PaymentModal user={selectedUser} onClose={() => setShowPaymentModal(false)} onMarkPaid={markDebtPaidHandler} />}
    </div>
  );
}

// --- UserDetailsModal (unchanged) ---
interface UserDetailsModalProps {
  user: PlatformUser;
  onClose: () => void;
  onVerifyLicense: (userId: string) => void;
  addToast: (toast: Omit<Toast, "id">) => void;
}
function UserDetailsModal({ user, onClose, onVerifyLicense }: UserDetailsModalProps) {
  const [showLicense, setShowLicense] = useState(false);
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between"><h3 className="text-xl font-black uppercase text-white">User Details</h3><button onClick={onClose}><X/></button></div>
        <div className="space-y-3 mt-4">
          <p><span className="text-zinc-500">Name:</span> {user.name}</p>
          <p><span className="text-zinc-500">Email:</span> {user.email}</p>
          <p><span className="text-zinc-500">Type:</span> {user.userType}</p>
          <p><span className="text-zinc-500">Status:</span> {user.status}</p>
          <p><span className="text-zinc-500">Debt:</span> €{user.currentDebt}</p>
          {user.userType === "Graveyard" && (
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Business License:</span>
                <button onClick={() => setShowLicense(!showLicense)} className="text-[#D4AF37] text-xs">{showLicense ? "Hide" : "Show"}</button>
              </div>
              {showLicense && <p className="font-mono text-sm mt-1">{user.businessLicense || "Not provided"}</p>}
              {user.businessLicense && !user.licenseVerified && (
                <button onClick={() => onVerifyLicense(user.id)} className="mt-3 bg-green-600 px-3 py-1 rounded text-xs">Verify License</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- PaymentModal (unchanged) ---
interface PaymentModalProps {
  user: PlatformUser;
  onClose: () => void;
  onMarkPaid: (userId: string, amount: number) => void;
}
function PaymentModal({ user, onClose, onMarkPaid }: PaymentModalProps) {
  const [amount, setAmount] = useState<number>(user.currentDebt ?? 0);
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-black uppercase text-white">Mark Debt as Paid</h3>
        <p className="text-zinc-400 mt-2">User: {user.name}</p>
        <p className="text-red-400 font-bold">Current Debt: €{user.currentDebt ?? 0}</p>
        <input
          type="number"
          value={isNaN(amount) ? 0 : amount}
          onChange={e => {
            const val = parseFloat(e.target.value);
            setAmount(isNaN(val) ? 0 : val);
          }}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mt-4 text-white"
        />
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 bg-white/5 py-2 rounded">Cancel</button>
          <button onClick={() => onMarkPaid(user.id, amount)} className="flex-1 bg-green-600 py-2 rounded">Confirm Payment</button>
        </div>
      </div>
    </div>
  );
}

// --- Inventory Tab (uses Server Actions) ---
interface InventoryTabProps {
  parts: Part[];
  setParts: React.Dispatch<React.SetStateAction<Part[]>>;
  addToast: (toast: Omit<Toast, "id">) => void;
}
function InventoryTab({ parts, setParts, addToast }: InventoryTabProps) {
  const [search, setSearch] = useState("");
  const filtered = parts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.sellerName.toLowerCase().includes(search.toLowerCase()));

  const handleFlag = async (id: string) => {
    try {
      await updatePartStatus(id, 'Flagged');
      setParts(prev => prev.map(p => p.id === id ? { ...p, status: "Flagged" } : p));
      addToast({ title: "Part flagged", variant: "default" });
    } catch (err: any) {
      addToast({ title: err.message || "Error flagging part", variant: "error" });
    }
  };
  const handleDelete = async (id: string) => {
    try {
      await updatePartStatus(id, 'Deleted');
      setParts(prev => prev.map(p => p.id === id ? { ...p, status: "Deleted" } : p));
      addToast({ title: "Part deleted", variant: "error" });
    } catch (err: any) {
      addToast({ title: err.message || "Error deleting part", variant: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between"><h2 className="text-3xl font-black italic uppercase text-white">Parts Inventory</h2><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white w-64"/></div>
      <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-x-auto">
        <table className="w-full min-w-200">
          <thead className="bg-white/5 text-[9px] font-black uppercase text-[#D4AF37]/60">
            <tr><th className="px-6 py-5">Part</th><th>Seller</th><th>Price</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map(part => (
              <tr key={part.id}>
                <td className="px-6 py-5"><div><p className="text-white font-bold">{part.title}</p><p className="text-[9px] text-zinc-500">{part.id}</p></div></td>
                <td className="px-6 py-5">{part.sellerName}</td>
                <td className="px-6 py-5 text-[#D4AF37] font-bold">€{part.price}</td>
                <td className="px-6 py-5"><span className={`text-[9px] font-bold px-2 py-1 rounded ${part.status === "Active" ? "text-green-400 bg-green-500/10" : part.status === "Flagged" ? "text-yellow-400 bg-yellow-500/10" : part.status === "Hidden" ? "text-orange-400 bg-orange-500/10" : "text-red-400 bg-red-500/10"}`}>{part.status}</span></td>
                <td className="px-6 py-5"><div className="flex gap-2"><button onClick={() => handleFlag(part.id)}><Flag size={14} className="text-yellow-400"/></button><button onClick={() => handleDelete(part.id)}><Trash2 size={14} className="text-red-400"/></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- System Logs Tab (mock) ---
function SystemLogsTab({ logs, addToast }: { logs: LogEntry[]; addToast: (toast: Omit<Toast, "id">) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black italic uppercase text-white">System Logs</h2>
      <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-x-auto">
        <table className="w-full min-w-175">
          <thead className="bg-white/5 text-[9px] font-black uppercase text-[#D4AF37]/60">
            <tr>
              <th className="px-6 py-5">Timestamp</th>
              <th className="px-6 py-5">User</th>
              <th className="px-6 py-5">Action</th>
              <th className="px-6 py-5">Level</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td className="px-6 py-4 text-xs font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="text-sm">{log.userName}</td>
                <td>{log.action}</td>
                <td><span className={`text-[9px] px-2 py-0.5 rounded ${log.level === "info" ? "bg-blue-500/10 text-blue-400" : "bg-yellow-500/10 text-yellow-400"}`}>{log.level}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Security Settings Tab (uses Server Actions) ---
interface SecuritySettingsTabProps {
  settings: SecuritySettings;
  setSettings: React.Dispatch<React.SetStateAction<SecuritySettings>>;
  addToast: (toast: Omit<Toast, "id">) => void;
}
function SecuritySettingsTab({ settings, setSettings, addToast }: SecuritySettingsTabProps) {
  const [newIp, setNewIp] = useState("");
  const [newBlockedIp, setNewBlockedIp] = useState("");
  const ipWhitelist = settings.ipWhitelist || [];
  const blockedIPs = settings.blockedIPs || [];

  const saveSettings = async () => {
    try {
      await updateSecuritySettings(settings);
      addToast({ title: "Settings saved", variant: "success" });
    } catch (err: any) {
      addToast({ title: err.message || "Error saving", variant: "error" });
    }
  };

  const addWhitelist = () => { if (newIp && !ipWhitelist.includes(newIp)) setSettings({ ...settings, ipWhitelist: [...ipWhitelist, newIp] }); setNewIp(""); };
  const removeWhitelist = (ip: string) => setSettings({ ...settings, ipWhitelist: ipWhitelist.filter(i => i !== ip) });
  const addBlocked = () => { if (newBlockedIp && !blockedIPs.includes(newBlockedIp)) setSettings({ ...settings, blockedIPs: [...blockedIPs, newBlockedIp] }); setNewBlockedIp(""); };
  const removeBlocked = (ip: string) => setSettings({ ...settings, blockedIPs: blockedIPs.filter(i => i !== ip) });

  return (
    <div className="max-w-3xl space-y-8">
      <h2 className="text-3xl font-black italic uppercase text-white">Security Settings</h2>
      <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-8 space-y-6">
        <div className="flex justify-between items-center"><div><h3 className="text-white font-bold">MFA Required</h3><p className="text-xs text-zinc-500">Require 2FA for all admins</p></div><button onClick={() => setSettings({ ...settings, mfaRequired: !settings.mfaRequired })} className={`relative w-12 h-6 rounded-full ${settings.mfaRequired ? "bg-[#D4AF37]" : "bg-white/20"}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.mfaRequired ? "left-7" : "left-1"}`}/></button></div>
        <div><h3 className="text-white font-bold">Session Timeout (minutes)</h3><input type="number" value={settings.sessionTimeout} onChange={e => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white w-32"/></div>
        <div><h3 className="text-white font-bold">IP Whitelist</h3><div className="flex gap-2"><input placeholder="192.168.1.0/24" value={newIp} onChange={e => setNewIp(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"/><button onClick={addWhitelist} className="bg-[#D4AF37] text-black px-4 rounded">Add</button></div><div className="flex flex-wrap gap-2 mt-2">{ipWhitelist.map(ip => <span key={ip} className="bg-white/10 px-3 py-1 rounded-full text-xs flex gap-2">{ip}<button onClick={() => removeWhitelist(ip)}><X size={12}/></button></span>)}</div></div>
        <div><h3 className="text-white font-bold">Blocked IPs</h3><div className="flex gap-2"><input placeholder="203.0.113.45" value={newBlockedIp} onChange={e => setNewBlockedIp(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white"/><button onClick={addBlocked} className="bg-red-600 text-white px-4 rounded">Block</button></div><div className="flex flex-wrap gap-2 mt-2">{blockedIPs.map(ip => <span key={ip} className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs flex gap-2">{ip}<button onClick={() => removeBlocked(ip)}><X size={12}/></button></span>)}</div></div>
        <div><h3 className="text-white font-bold">Auto‑Suspend Debt (days)</h3><input type="number" value={settings.autoSuspendDebtDays} onChange={e => setSettings({ ...settings, autoSuspendDebtDays: parseInt(e.target.value) })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white w-32"/></div>
        <div className="flex justify-between items-center"><div><h3 className="text-white font-bold">Auto‑hide listings on debt</h3><p className="text-xs text-zinc-500">Hide parts when user has debt older than above days</p></div><button onClick={() => setSettings({ ...settings, autoHideListingsOnDebt: !settings.autoHideListingsOnDebt })} className={`relative w-12 h-6 rounded-full ${settings.autoHideListingsOnDebt ? "bg-[#D4AF37]" : "bg-white/20"}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.autoHideListingsOnDebt ? "left-7" : "left-1"}`}/></button></div>
        <button onClick={saveSettings} className="bg-[#D4AF37] text-black px-8 py-3 rounded-xl font-bold">Save Changes</button>
      </div>
    </div>
  );
}

// --- Admin Profile Modal (uses hardcoded Server Actions) ---
interface AdminProfileModalProps {
  onClose: () => void;
  addToast: (toast: Omit<Toast, "id">) => void;
}
function AdminProfileModal({ onClose, addToast }: AdminProfileModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { getProfile } = await import('@/app/actions/profile');
        const data = await getProfile();
        setName(data.name || 'Admin');
        setEmail(data.email || '');
      } catch (err) {
        addToast({ title: "Error loading profile", variant: "error" });
      }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    if (newPassword && newPassword !== confirm) {
      addToast({ title: "Passwords do not match", variant: "error" });
      return;
    }
    if (newPassword && !currentPassword) {
      addToast({ title: "Current password required", variant: "error" });
      return;
    }
    try {
      const { updateProfile } = await import('@/app/actions/profile');
      await updateProfile(name, currentPassword, newPassword);
      addToast({ title: "Profile updated", variant: "success" });
      onClose();
    } catch (err: any) {
      addToast({ title: err.message || "Error updating profile", variant: "error" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between"><h3 className="text-xl font-black uppercase text-white">Admin Profile</h3><button onClick={onClose}><X/></button></div>
        <div className="space-y-4 mt-4">
          <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
          <input placeholder="Email" value={email} disabled className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white opacity-50 cursor-not-allowed" />
          <div className="border-t pt-4"><p className="text-[#D4AF37] text-xs font-bold">Change Password</p></div>
          <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
          <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
          <input type="password" placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
        </div>
        <div className="flex gap-3 mt-6"><button onClick={onClose} className="flex-1 bg-white/5 py-2 rounded">Cancel</button><button onClick={handleSave} className="flex-1 bg-[#D4AF37] text-black py-2 rounded font-bold">Save</button></div>
      </div>
    </div>
  );
}

// --- MAIN ADMIN DASHBOARD ---
export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("users");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    mfaRequired: false,
    sessionTimeout: 30,
    ipWhitelist: [],
    blockedIPs: [],
    autoSuspendDebtDays: 30,
    autoHideListingsOnDebt: true,
  });

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [usersData, partsData, settingsData] = await Promise.all([
          getUsers(),
          getParts(),
          getSecuritySettings(),
        ]);
        // Map snake_case to camelCase for users
        setUsers(usersData.map((u: any) => ({ ...u, userType: u.user_type })));
        setParts(partsData.map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          sellerId: p.seller_id,
          sellerName: p.users?.name || "Unknown",
          condition: p.condition || "Used",
          status: p.status,
          createdAt: p.created_at.split("T")[0],
        })));
        setSecuritySettings(settingsData);
        setLogs([]);
      } catch (err) {
        console.error(err);
        addToast({ title: "Error loading data", variant: "error" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[#D4AF37]">Loading Admin Panel...</div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 font-sans flex">
      {/* Sidebar (unchanged) */}
      <aside className={`fixed md:relative z-50 w-72 bg-[#080808] border-r border-[#D4AF37]/10 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-[#D4AF37] to-[#AA8419] rounded-xl flex items-center justify-center"><ShieldCheck size={22} className="text-black" /></div>
              <div><h1 className="text-xl font-black italic uppercase text-white">Graveyard</h1><p className="text-[9px] text-[#D4AF37] font-bold tracking-[0.3em] uppercase">Admin Center</p></div>
            </div>
            <button className="md:hidden text-zinc-400" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
          </div>
          <nav className="space-y-2">
            <NavBtn label="Analytics" icon={BarChart3} active={activeTab === "stats"} onClick={() => setActiveTab("stats")} />
            <NavBtn label="User Management" icon={Users} active={activeTab === "users"} onClick={() => setActiveTab("users")} />
            <NavBtn label="Parts Inventory" icon={Car} active={activeTab === "parts"} onClick={() => setActiveTab("parts")} />
            <NavBtn label="System Logs" icon={HardDrive} active={activeTab === "logs"} onClick={() => setActiveTab("logs")} />
            <NavBtn label="Security Settings" icon={Lock} active={activeTab === "security"} onClick={() => setActiveTab("security")} />
          </nav>
          <div className="mt-auto pt-8 border-t border-white/5">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => setShowProfileModal(true)} className="flex items-center gap-3 text-zinc-400 hover:text-white text-sm font-bold"><User size={18} /> Admin Profile</button>
              <div className="relative"><Bell size={18} className="text-[#D4AF37]" />{notificationCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center">{notificationCount}</span>}</div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-3 text-red-500/70 hover:text-red-500 text-sm font-bold mb-6"><LogOut size={18} /> Logout</button>
            <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em] italic">Powered by Enklan Sh.p.k</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10">
        <div className="fixed bottom-4 right-4 z-50 space-y-2">{toasts.map((toast) => <ToastMessage key={toast.id} toast={toast} />)}</div>
        {activeTab === "stats" && <AnalyticsTab users={users} parts={parts} />}
        {activeTab === "users" && <UserManagementTab users={users} setUsers={setUsers} addToast={addToast} securitySettings={securitySettings} />}
        {activeTab === "parts" && <InventoryTab parts={parts} setParts={setParts} addToast={addToast} />}
        {activeTab === "logs" && <SystemLogsTab logs={logs} addToast={addToast} />}
        {activeTab === "security" && <SecuritySettingsTab settings={securitySettings} setSettings={setSecuritySettings} addToast={addToast} />}
      </main>

      {showProfileModal && <AdminProfileModal onClose={() => setShowProfileModal(false)} addToast={addToast} />}
    </div>
  );
}