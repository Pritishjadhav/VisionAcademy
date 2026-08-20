/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { createStudentUser, linkParentAccount } from "@/actions/users";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, Mail, Calendar, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { getRequiredIdToken } from "@/lib/auth-token";

interface Student {
  id: string;
  name: string;
  mobile: string;
  parentMobile?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  batch?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student: Student | null;
}

export function StudentFormModal({ isOpen, onClose, onSuccess, student }: Props) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [parentMobile, setParentMobile] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [batch, setBatch] = useState("");
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setMobile(student.mobile.replace("+91", ""));
      setParentMobile(student.parentMobile ? student.parentMobile.replace("+91", "") : "");
      const studentEmail = student.email || "";
      const isSynthetic = (em: string) => em.includes("@visionacademy.com");
      setEmail(!isSynthetic(studentEmail) ? studentEmail : "");
      setGender(student.gender || "");
      setDateOfBirth(student.dateOfBirth || "");
      setBatch(student.batch || "");
    } else {
      setName("");
      setMobile("");
      setParentMobile("");
      setEmail("");
      setGender("");
      setDateOfBirth("");
      setBatch("");
    }
  }, [student, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length < 10) {
      toast.error("Student mobile must be at least 10 digits");
      return;
    }

    setLoading(true);
    try {
      const idToken = await getRequiredIdToken();
      const formattedMobile = mobile.startsWith("+91") ? mobile : `+91${mobile}`;
      const formattedParentMobile = parentMobile 
        ? (parentMobile.startsWith("+91") ? parentMobile : `+91${parentMobile}`) 
        : "";

      const studentData = {
        name,
        mobile: formattedMobile,
        parentMobile: formattedParentMobile,
        email,
        gender,
        dateOfBirth,
        batch,
        role: "student",
        updatedAt: new Date().toISOString()
      };

      if (student) {
        // Edit existing
        const oldDoc = await getDoc(doc(db, "students", student.id));
        const oldParentMobile = oldDoc.exists() ? oldDoc.data().parentMobile : "";
        
        await updateDoc(doc(db, "students", student.id), studentData);
        
        // If parent mobile changed or was added, try to link/create the parent account
        if (formattedParentMobile && formattedParentMobile !== oldParentMobile) {
          await linkParentAccount(idToken, student.id, name, formattedParentMobile);
        }
        
        toast.success("Student updated successfully");
      } else {
        // Add new
        const result = await createStudentUser(idToken, {
          name,
          mobile: formattedMobile,
          parentMobile: formattedParentMobile,
          email,
          gender,
          dateOfBirth,
          batch
        });

        if (!result.success) {
          toast.error(result.error || "Failed to create student");
          setLoading(false);
          return;
        }
        toast.success("Student added successfully");
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      toast.error((error as Error).message || "Failed to save student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100]"
          />

          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl pointer-events-auto relative flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
                <h3 className="text-xl font-bold text-slate-900">
                  {student ? "Edit Student" : "Add New Student"}
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto p-6">
                <form id="student-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Full Name</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <User size={18} />
                        </div>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                      <p className="text-xs font-bold text-red-600 ml-1 bg-red-50 inline-block px-2 py-1 rounded-md mt-1">Format: Last Name First Name Middle Name</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail size={18} />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
                          placeholder="student@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Student Mobile *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Phone size={18} />
                        </div>
                        <input
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
                          placeholder="10-digit mobile number"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Parent Mobile</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Phone size={18} />
                        </div>
                        <input
                          type="tel"
                          value={parentMobile}
                          onChange={(e) => setParentMobile(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
                          placeholder="10-digit mobile number"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Calendar size={18} />
                        </div>
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all appearance-none bg-white"
                      >
                        <option value="" disabled>Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Batch</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <GraduationCap size={18} />
                        </div>
                        <select
                          value={batch}
                          onChange={(e) => setBatch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none transition-all appearance-none bg-white"
                        >
                          <option value="" disabled>Select Batch</option>
                          <option value="11th IIT-JEE Integrated">11th IIT-JEE Integrated</option>
                          <option value="12th IIT-JEE Integrated">12th IIT-JEE Integrated</option>
                          <option value="11th NEET Integrated">11th NEET Integrated</option>
                          <option value="12th NEET Integrated">12th NEET Integrated</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" form="student-form" variant="primary" className="flex-1" disabled={loading}>
                  {loading ? "Saving..." : "Save Student"}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
