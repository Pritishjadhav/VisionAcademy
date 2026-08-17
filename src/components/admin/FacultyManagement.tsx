/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Button } from "@/components/ui/Button";
import { Plus, Search, BookOpen, CheckCircle, XCircle, Trash2, User } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { createFacultyUser, deleteFacultyUser } from "@/actions/faculty";
import { getRequiredIdToken } from "@/lib/auth-token";
import Image from "next/image";

interface FacultyUser {
  id: string;
  email: string;
  name: string;
  mobile?: string;
  subject: string;
  role: "faculty";
  enabled: boolean;
  photoUrl?: string;
}

export function FacultyManagement() {
  const { role } = useAuth();
  const [faculty, setFaculty] = useState<FacultyUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "faculty"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FacultyUser[];
      setFaculty(data);
    } catch (error) {
      toast.error("Failed to load faculty");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "super_admin" || role === "admin") {
      fetchFaculty();
    }
  }, [role]);

  const handleToggleEnable = async (id: string, currentStatus: boolean) => {
    if (role !== "super_admin" && role !== "admin") return;
    try {
      await updateDoc(doc(db, "faculty", id), {
        enabled: !currentStatus
      });
      toast.success(`Faculty ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
      fetchFaculty();
    } catch (error) {
      toast.error("Failed to update faculty status");
    }
  };

  const handleDeleteFaculty = async (id: string, email: string) => {
    if (role !== "super_admin" && role !== "admin") return;
    if (!confirm(`Are you sure you want to permanently delete the faculty ${email}?`)) return;
    
    try {
      const result = await deleteFacultyUser(await getRequiredIdToken(), id);
      if (result.success) {
        toast.success("Faculty deleted permanently");
        fetchFaculty();
      } else {
        toast.error(result.error || "Failed to delete faculty");
      }
    } catch (error) {
      toast.error("Failed to delete faculty");
    }
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || (role !== "super_admin" && role !== "admin")) return;
    
    setIsAdding(true);
    try {
      const result = await createFacultyUser(await getRequiredIdToken(), newEmail);
      
      if (result.success) {
        toast.success(`Faculty added. Temporary password: ${result.temporaryPassword}`, { duration: 15000 });
        setNewEmail("");
        fetchFaculty();
      } else {
        toast.error(result.error || "Failed to add faculty");
      }
    } catch (error) {
      toast.error((error as Error).message || "Failed to add faculty");
    } finally {
      setIsAdding(false);
    }
  };

  if (role !== "super_admin" && role !== "admin") return null;

  const filteredFaculty = faculty.filter(f => 
    f.email.toLowerCase().includes(search.toLowerCase()) || 
    (f.name && f.name.toLowerCase().includes(search.toLowerCase())) ||
    (f.subject && f.subject.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="mt-12 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="text-orange-500" />
            Faculty Management
          </h2>
          <p className="text-slate-500">Manage faculty access to the platform.</p>
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
              placeholder="Search faculty..."
            />
          </div>
          
          <form onSubmit={handleAddFaculty} className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="New faculty email"
              className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none w-full sm:w-64"
              required
            />
            <Button type="submit" variant="gradient" disabled={isAdding}>
              <Plus size={18} className="sm:mr-2" />
              <span className="hidden sm:inline">Add Faculty</span>
            </Button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm font-medium">
              <tr>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email Address</th>
                <th className="py-4 px-6">Mobile Number</th>
                <th className="py-4 px-6">Subject</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Loading faculty...</td>
                </tr>
              ) : filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No faculty found.</td>
                </tr>
              ) : (
                filteredFaculty.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0 relative">
                          {f.photoUrl ? (
                            <Image src={f.photoUrl} alt={f.name || "Faculty"} fill className="object-cover" />
                          ) : (
                            <User className="text-slate-400" size={20} />
                          )}
                        </div>
                        <span className="font-medium text-slate-900">
                          {f.name || <span className="text-slate-400 italic font-normal">Not set</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <a href={`mailto:${f.email}`} className="hover:text-brand-orange transition-colors">
                        {f.email}
                      </a>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {f.mobile ? (
                        <a href={`tel:${f.mobile}`} className="hover:text-brand-orange transition-colors">
                          {f.mobile}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-sm">Not set</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {f.subject ? (
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200">
                          {f.subject}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-sm">Not set</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`flex items-center gap-1.5 text-sm font-medium ${
                        f.enabled ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {f.enabled ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {f.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-4 px-6 flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleToggleEnable(f.id, f.enabled)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          f.enabled 
                            ? 'text-yellow-600 hover:bg-yellow-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {f.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button 
                        onClick={() => handleDeleteFaculty(f.id, f.email)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Faculty Permanently"
                      >
                        <Trash2 size={18} />
                      </button>
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
