/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { Plus, Search, ShieldAlert, CheckCircle, XCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { createAdminUser, deleteAdminUser } from "@/actions/users";

interface AdminUser {
  id: string;
  email: string;
  role: "super_admin" | "admin";
  enabled: boolean;
}

export function AdminManagement() {
  const { role } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "admins"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminUser[];
      setAdmins(data);
    } catch (error) {
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "super_admin" || role === "admin") {
      fetchAdmins();
    }
  }, [role]);

  const handleToggleEnable = async (id: string, currentStatus: boolean) => {
    if (role !== "super_admin" && role !== "admin") return;
    try {
      await updateDoc(doc(db, "admins", id), {
        enabled: !currentStatus
      });
      toast.success(`Admin ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
      fetchAdmins();
    } catch (error) {
      toast.error("Failed to update admin status");
    }
  };

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (role !== "super_admin" && role !== "admin") return;
    if (!confirm(`Are you sure you want to permanently delete the admin ${email}?`)) return;
    
    try {
      const result = await deleteAdminUser(id);
      if (result.success) {
        toast.success("Admin deleted permanently");
        fetchAdmins();
      } else {
        toast.error(result.error || "Failed to delete admin");
      }
    } catch (error) {
      toast.error("Failed to delete admin");
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || (role !== "super_admin" && role !== "admin")) return;
    
    setIsAdding(true);
    try {
      const result = await createAdminUser(newEmail);
      
      if (result.success) {
        toast.success(`Admin added successfully! They can log in using their email as the password.`);
        setNewEmail("");
        fetchAdmins();
      } else {
        toast.error(result.error || "Failed to add admin");
      }
    } catch (error) {
      toast.error((error as Error).message || "Failed to add admin");
    } finally {
      setIsAdding(false);
    }
  };

  if (role !== "super_admin" && role !== "admin") return null;

  const filteredAdmins = admins.filter(admin => 
    admin.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mt-12 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-brand-orange" />
            Admin Management
          </h2>
          <p className="text-slate-500">Manage administrative access to the platform.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
              placeholder="Search admins..."
            />
          </div>
          
          <form onSubmit={handleAddAdmin} className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="New admin email"
              className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none w-full sm:w-64"
              required
            />
            <Button type="submit" variant="gradient" disabled={isAdding}>
              <Plus size={18} className="sm:mr-2" />
              <span className="hidden sm:inline">Add Admin</span>
            </Button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm font-medium">
              <tr>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">Loading admins...</td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">No admins found.</td>
                </tr>
              ) : (
                filteredAdmins.map(admin => (
                  <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-900">{admin.email}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        admin.role === 'super_admin' ? 'bg-brand-orange/10 text-brand-orange' : 'bg-brand-blue/10 text-brand-blue'
                      }`}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`flex items-center gap-1.5 text-sm font-medium ${
                        admin.enabled ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {admin.enabled ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {admin.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-4 px-6 flex items-center justify-end gap-2">
                      {admin.email !== 'visionacademy7979@gmail.com' && (
                        <>
                          <button 
                            onClick={() => handleToggleEnable(admin.id, admin.enabled)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              admin.enabled 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {admin.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button 
                            onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Admin Permanently"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
