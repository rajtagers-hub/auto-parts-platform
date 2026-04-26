"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { updateUserStatus } from "@/app/actions/admin"; // still use server action for mutations

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
      console.error("Error fetching users:", error);
      // If RLS is still blocking, you'll see the error here
      alert("Error loading users: " + error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (userId: string, currentStatus: string) => {
  const newStatus = currentStatus === "Active" ? "Suspended" : "Active";
  setUpdating(userId);
  try {
    const res = await fetch("/api/admin/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newStatus }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");
    if (data.success && data.updatedUser) {
      setUsers(prev =>
        prev.map(u =>
          u.id === userId ? { ...u, status: data.updatedUser.status } : u
        )
      );
    } else {
      throw new Error("Update failed");
    }
  } catch (err: any) {
    alert(err.message);
  } finally {
    setUpdating(null);
  }
};
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="p-6 text-white">Loading users...</div>;

  return (
    <div className="p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 px-4 py-2 rounded text-sm"
        >
          Logout
        </button>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-white/20">
            <th className="text-left py-2">Name</th>
            <th className="text-left py-2">Email</th>
            <th className="text-left py-2">Status</th>
            <th className="text-left py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-b border-white/10">
              <td className="py-2">{user.name}</td>
              <td className="py-2">{user.email}</td>
              <td className="py-2">{user.status}</td>
              <td className="py-2">
                <button
                  onClick={() => toggleStatus(user.id, user.status)}
                  disabled={updating === user.id}
                  className="bg-yellow-600 px-3 py-1 rounded text-xs disabled:opacity-50"
                >
                  {updating === user.id ? "Updating..." : "Toggle"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}