/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "@/lib/firebase/config";
import { uploadImageToCloudinary } from "@/actions/cloudinary";
import { linkParentAccount } from "@/actions/users";
import { getRequiredIdToken } from "@/lib/auth-token";
import { Button } from "@/components/ui/Button";
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import { Loader2, User, Mail, Phone, Calendar, Users, GraduationCap, Edit2, Save, Camera, Upload, Trash2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function StudentProfilePage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  
  // Cropper State
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

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
        setPhotoURL(data.photoURL || user.photoURL || null);

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];
    
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }

    // Read file to data URL and open cropper
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setSelectedImageSrc(reader.result?.toString() || null);
    });
    reader.readAsDataURL(file);

    // Reset input
    if (e.target) e.target.value = '';
  };

  const handleCropComplete = async (croppedFile: File) => {
    if (!user) return;
    
    try {
      setUploadingPhoto(true);
      
      const formData = new FormData();
      formData.append("file", croppedFile);
      formData.append("folder", `profile-photos/${user.uid}`);
      
      // Upload to Cloudinary using Server Action
      const url = await uploadImageToCloudinary(formData);
      
      // Update Auth Profile
      await updateProfile(user, { photoURL: url });
      
      // Update Firestore Doc
      const docRef = doc(db, "students", user.uid);
      await updateDoc(docRef, { photoURL: url });
      
      setPhotoURL(url);
      toast.success("Profile photo updated successfully!");
      setSelectedImageSrc(null); // Close modal
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to remove your profile photo?")) return;
    
    try {
      setUploadingPhoto(true);
      // Update Auth Profile
      await updateProfile(user, { photoURL: null });
      // Update Firestore Doc
      const docRef = doc(db, "students", user.uid);
      await updateDoc(docRef, { photoURL: null });
      
      setPhotoURL(null);
      toast.success("Profile photo removed.");
    } catch (error) {
      console.error("Error removing photo:", error);
      toast.error("Failed to remove photo.");
    } finally {
      setUploadingPhoto(false);
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
            
            {/* Profile Photo Section */}
            <div className="flex flex-col items-center justify-center py-4 border-b border-slate-100 mb-6">
              <div className="relative group mb-4">
                <div className="relative rounded-full p-1 sm:p-[6px] bg-gradient-to-br from-orange-500 via-white to-green-600 shadow-xl">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-[3px] sm:border-4 border-white bg-slate-50 flex items-center justify-center">
                    {uploadingPhoto ? (
                      <Loader2 className="animate-spin text-brand-blue" size={32} />
                    ) : photoURL ? (
                      <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="text-slate-300" />
                    )}
                  </div>
                </div>
                
                {isEditing && (
                  <label className="absolute bottom-0 right-0 p-2 sm:p-2.5 bg-brand-blue text-white rounded-full shadow-md cursor-pointer hover:bg-blue-700 hover:scale-105 transition-all">
                    <Camera size={16} className="sm:w-5 sm:h-5" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handlePhotoUpload} 
                      disabled={uploadingPhoto}
                    />
                  </label>
                )}
              </div>
              <div className="text-center flex flex-col items-center gap-2">
                <div>
                  <h3 className="font-semibold text-slate-800">Profile Photo</h3>
                  {isEditing && (
                    <p className="text-xs text-slate-500 mt-1">Click the camera icon to upload or change your photo.</p>
                  )}
                </div>
                {photoURL && (
                  <div className="flex flex-wrap justify-center items-center gap-3">
                    <a 
                      href={photoURL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-brand-blue hover:text-blue-700 hover:bg-brand-blue/5 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                    >
                      <Eye size={14} /> View Photo
                    </a>
                    {isEditing && (
                      <button 
                        type="button" 
                        onClick={handleRemovePhoto} 
                        disabled={uploadingPhoto}
                        className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 size={14} /> Remove Photo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

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

      {selectedImageSrc && (
        <ImageCropperModal
          imageSrc={selectedImageSrc}
          onCropComplete={handleCropComplete}
          onClose={() => setSelectedImageSrc(null)}
          isUploading={uploadingPhoto}
        />
      )}
    </div>
  );
}
