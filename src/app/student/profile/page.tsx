/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { linkParentAccount } from "@/actions/users";
import { getRequiredIdToken } from "@/lib/auth-token";
import { Button } from "@/components/ui/Button";
import { Loader2, User, Mail, Phone, Calendar, Users, GraduationCap, Edit2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function StudentProfilePage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    dateOfBirth: "",
    mobile: "",
    parentMobile: "",
    email: "",
    batch: "",
  });

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, "students", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const storedEmail = data.email || "";
        const authEmail = user.email || "";
        const isSynthetic = (em: string) => em.includes("@visionacademy.com");
        const displayEmail = (!isSynthetic(storedEmail) ? storedEmail : "") || (!isSynthetic(authEmail) ? authEmail : "");

        setFormData({
          name: data.name || "",
          gender: data.gender || "",
          dateOfBirth: data.dateOfBirth || "",
          mobile: data.mobile || "",
          parentMobile: data.parentMobile || "",
          email: displayEmail,
          batch: data.batch || "",
        });
        
        // If profile hasn't been completed yet (missing batch or gender), open in edit mode automatically
        if (!data.batch || !data.gender) {
          setIsEditing(true);
        }
      } else {
        toast.error("Profile not found.");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user || role !== "student") {
        router.push("/login/student");
      } else {
        fetchProfile();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validation
    if (!formData.name || !formData.gender || !formData.dateOfBirth || !formData.mobile || !formData.batch) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, "students", user.uid);
      const oldDoc = await getDoc(docRef);
      const oldParentMobile = oldDoc.exists() ? oldDoc.data().parentMobile : "";

      const formattedParentMobile = formData.parentMobile 
        ? (formData.parentMobile.startsWith("+91") ? formData.parentMobile : `+91${formData.parentMobile}`) 
        : "";

      const dataToUpdate = {
        ...formData,
        parentMobile: formattedParentMobile,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(docRef, dataToUpdate);
      
      // If parent mobile changed or was added, try to link/create the parent account
      if (formattedParentMobile && formattedParentMobile !== oldParentMobile) {
        await linkParentAccount(await getRequiredIdToken(), user.uid, formData.name, formattedParentMobile);
      }
      
      toast.success(isEditing && formData.batch ? "Profile updated successfully." : "Your profile has been saved successfully.");
      setIsEditing(false);
      router.push("/student/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-blue" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">User Profile</h1>
            <p className="text-slate-500">Manage your personal and academic information.</p>
          </div>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit2 size={16} className="mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Full Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <p className="text-xs font-bold text-red-600 ml-1 bg-red-50 inline-block px-2 py-1 rounded-md mt-1">Format: Last Name First Name Middle Name</p>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Mobile Number *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Enter mobile number"
                    required
                  />
                </div>
              </div>

              {/* Parent Mobile Number */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Parent&apos;s Mobile Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Users size={18} />
                  </div>
                  <input
                    type="tel"
                    name="parentMobile"
                    value={formData.parentMobile}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Enter parent&apos;s mobile"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Date of Birth *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar size={18} />
                  </div>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                    required
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 appearance-none bg-white"
                  required
                >
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Batch */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Batch *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap size={18} />
                  </div>
                  <select
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 appearance-none bg-white"
                    required
                  >
                    <option value="" disabled>Select your batch</option>
                    <option value="11th IIT-JEE Integrated">11th IIT-JEE Integrated</option>
                    <option value="12th IIT-JEE Integrated">12th IIT-JEE Integrated</option>
                    <option value="11th NEET Integrated">11th NEET Integrated</option>
                    <option value="12th NEET Integrated">12th NEET Integrated</option>
                  </select>
                </div>
              </div>

            </div>

            {isEditing && (
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    fetchProfile(); // Revert changes
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? (
                    <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</>
                  ) : (
                    <><Save size={16} className="mr-2" /> Save Profile</>
                  )}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
