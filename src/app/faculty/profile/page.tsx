/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Loader2, User, Mail, Phone, Calendar, BookOpen, Edit2, Save, ChevronDown, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const SUBJECTS = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "Geography",
  "English",
  "IT",
  "CS"
];

export default function FacultyProfilePage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    dateOfBirth: "",
    mobile: "",
    email: "",
    subject: "",
  });

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, "faculty", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const storedEmail = data.email || "";

        setFormData({
          name: data.name || "",
          gender: data.gender || "",
          dateOfBirth: data.dateOfBirth || "",
          mobile: data.mobile || "",
          email: storedEmail,
          subject: data.subject || "",
        });
        
        // If profile hasn't been completed yet, open in edit mode automatically
        if (!data.name || !data.subject || !data.gender) {
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
      if (!user || role !== "faculty") {
        router.push("/login/faculty");
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
    if (!formData.name || !formData.mobile || !formData.subject || !formData.dateOfBirth || !formData.gender) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, "faculty", user.uid);
      
      await updateDoc(docRef, {
        name: formData.name,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        mobile: formData.mobile,
        subject: formData.subject,
        updatedAt: new Date().toISOString()
      });

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      router.push("/faculty/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center border-4 border-orange-100 shrink-0">
              <User size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {formData.name || "Faculty Member"}
              </h1>
              <p className="text-slate-500 font-medium">Faculty Profile</p>
            </div>
          </div>
          
          {!isEditing && (
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(true)}
              className="text-orange-600 border-orange-200 hover:bg-orange-50 w-full sm:w-auto"
            >
              <Edit2 size={18} className="mr-2" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="border-b border-slate-100 p-6 bg-slate-50/50 rounded-t-2xl">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <User size={20} className="text-orange-500" />
              Personal Information
            </h2>
          </div>
          
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSave} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Email Address <span className="text-xs text-slate-400 font-normal">(Read Only)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-500 cursor-not-allowed"
                      placeholder="Email provided by admin"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      placeholder="10-digit number"
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 z-10">
                      <User size={18} />
                    </div>
                    <button
                      type="button"
                      disabled={!isEditing}
                      onClick={() => setIsGenderDropdownOpen(!isGenderDropdownOpen)}
                      className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border text-left rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed ${isGenderDropdownOpen ? 'border-orange-500 ring-2 ring-orange-500/50' : 'border-slate-200'} ${formData.gender ? 'text-slate-900' : 'text-slate-500'}`}
                    >
                      <span className="block truncate">{formData.gender || "Select gender"}</span>
                    </button>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 z-10">
                      <ChevronDown size={18} className={`transition-transform duration-200 ${isGenderDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isGenderDropdownOpen && isEditing && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsGenderDropdownOpen(false)}></div>
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="max-h-60 overflow-y-auto">
                            {["Male", "Female"].map(gender => (
                              <button
                                key={gender}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, gender }));
                                  setIsGenderDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors flex justify-between items-center ${formData.gender === gender ? 'bg-orange-50/50 text-orange-600 font-medium' : 'text-slate-700'}`}
                              >
                                {gender}
                                {formData.gender === gender && <Check size={16} className="text-orange-500" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Subject Taught */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Subject Taught <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 z-10">
                      <BookOpen size={18} />
                    </div>
                    <button
                      type="button"
                      disabled={!isEditing}
                      onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                      className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border text-left rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed ${isSubjectDropdownOpen ? 'border-orange-500 ring-2 ring-orange-500/50' : 'border-slate-200'} ${formData.subject ? 'text-slate-900' : 'text-slate-500'}`}
                    >
                      <span className="block truncate">{formData.subject || "Select a subject"}</span>
                    </button>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 z-10">
                      <ChevronDown size={18} className={`transition-transform duration-200 ${isSubjectDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {isSubjectDropdownOpen && isEditing && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setIsSubjectDropdownOpen(false)}></div>
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="max-h-60 overflow-y-auto">
                            {SUBJECTS.map(subject => (
                              <button
                                key={subject}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, subject }));
                                  setIsSubjectDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors flex justify-between items-center ${formData.subject === subject ? 'bg-orange-50/50 text-orange-600 font-medium' : 'text-slate-700'}`}
                              >
                                {subject}
                                {formData.subject === subject && <Check size={16} className="text-orange-500" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      fetchProfile(); // Reset form to saved data
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={18} className="animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
