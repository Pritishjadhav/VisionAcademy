/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Loader2, User, Mail, Phone, Calendar, BookOpen, Edit2, Save, ChevronDown, Check, Camera, Trash2, Eye, MoreVertical, X } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { uploadImageToCloudinary } from "@/actions/cloudinary";
import Image from "next/image";
import { ImageCropper } from "@/components/ui/ImageCropper";

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
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    dateOfBirth: "",
    mobile: "",
    email: "",
    subject: "",
    photoUrl: "",
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
          photoUrl: data.photoUrl || "",
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
        photoUrl: formData.photoUrl,
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Read the file as a data url to pass to cropper
    const reader = new FileReader();
    reader.addEventListener("load", () =>
      setCropImageSrc(reader.result?.toString() || "")
    );
    reader.readAsDataURL(file);
    setShowPhotoMenu(false); // Close menu
  };

  const handleCropComplete = async (croppedFile: File) => {
    setCropImageSrc(null); // Close cropper modal
    setUploadingPhoto(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", croppedFile);
      uploadData.append("folder", "faculty_profiles");

      const url = await uploadImageToCloudinary(uploadData);
      setFormData((prev) => ({ ...prev, photoUrl: url }));
      toast.success("Photo cropped and uploaded! Click 'Save Changes' to update profile.");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = () => {
    setFormData((prev) => ({ ...prev, photoUrl: "" }));
    setShowPhotoMenu(false);
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
            <div className="relative">
              <div 
                className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center border-4 border-orange-100 shrink-0 overflow-hidden relative cursor-pointer"
                onClick={() => {
                  if (formData.photoUrl && !isEditing) setShowViewModal(true);
                }}
              >
                {formData.photoUrl ? (
                  <Image src={formData.photoUrl} alt="Profile" fill className="object-cover" />
                ) : (
                  <User size={32} />
                )}
                
                {/* Always visible upload overlay when editing */}
                {isEditing && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 py-1 flex justify-center pointer-events-none">
                    <Camera className="text-white w-4 h-4" />
                  </div>
                )}
              </div>
              
              {/* Photo Action Menu */}
              {isEditing && (
                <div className="absolute -bottom-2 -right-2">
                  <button
                    type="button"
                    onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                    disabled={uploadingPhoto}
                    className="bg-orange-500 text-white p-1.5 rounded-full shadow-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                    title="Photo Options"
                  >
                    {uploadingPhoto ? <Loader2 className="animate-spin" size={16} /> : <MoreVertical size={16} />}
                  </button>

                  {showPhotoMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowPhotoMenu(false)}></div>
                      <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 py-2 w-48 z-20 animate-in fade-in slide-in-from-top-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center text-sm text-slate-700"
                        >
                          <Camera size={16} className="mr-2 text-slate-400" />
                          Upload & Crop
                        </button>
                        {formData.photoUrl && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setShowViewModal(true);
                                setShowPhotoMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center text-sm text-slate-700"
                            >
                              <Eye size={16} className="mr-2 text-slate-400" />
                              View Photo
                            </button>
                            <button
                              type="button"
                              onClick={handleDeletePhoto}
                              className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center text-sm text-red-600"
                            >
                              <Trash2 size={16} className="mr-2 text-red-400" />
                              Remove Photo
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {isEditing && (
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                />
              )}
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

      {/* Image Cropper Modal */}
      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropImageSrc(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      )}

      {/* View Photo Modal */}
      {showViewModal && formData.photoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="relative max-w-sm sm:max-w-md w-full animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowViewModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2"
            >
              <X size={24} />
            </button>
            <div className="relative aspect-square w-full rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
              <Image src={formData.photoUrl} alt="Profile Full" fill className="object-cover" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
