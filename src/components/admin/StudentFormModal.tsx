/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { createStudentUser } from "@/actions/users";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface Student {
  id: string;
  name: string;
  mobile: string;
  parentMobile?: string;
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setMobile(student.mobile.replace("+91", ""));
      setParentMobile(student.parentMobile ? student.parentMobile.replace("+91", "") : "");
    } else {
      setName("");
      setMobile("");
      setParentMobile("");
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
      const formattedMobile = mobile.startsWith("+91") ? mobile : `+91${mobile}`;
      const formattedParentMobile = parentMobile 
        ? (parentMobile.startsWith("+91") ? parentMobile : `+91${parentMobile}`) 
        : "";

      const studentData = {
        name,
        mobile: formattedMobile,
        parentMobile: formattedParentMobile,
        role: "student",
        updatedAt: new Date().toISOString()
      };

      if (student) {
        // Edit existing
        await updateDoc(doc(db, "students", student.id), studentData);
        toast.success("Student updated successfully");
      } else {
        // Add new
        const result = await createStudentUser({
          name,
          mobile: formattedMobile,
          parentMobile: formattedParentMobile
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto relative overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
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

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Student Mobile</label>
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
                  <label className="text-sm font-medium text-slate-700">Parent Mobile <span className="text-slate-400 font-normal">(Optional)</span></label>
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

                <div className="pt-4 flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
                    {loading ? "Saving..." : "Save Student"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}


