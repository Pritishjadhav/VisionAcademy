"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, User, Mail, Phone, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { FacultyLectureTracking } from "@/components/admin/FacultyLectureTracking";
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

export default function FacultyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const facultyId = params.id as string;
  const [faculty, setFaculty] = useState<FacultyUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFaculty() {
      try {
        const docRef = doc(db, "faculty", facultyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFaculty({ id: docSnap.id, ...docSnap.data() } as FacultyUser);
        } else {
          toast.error("Faculty not found");
          router.push("/admin/dashboard/faculty");
        }
      } catch (error) {
        toast.error("Failed to load faculty profile");
      } finally {
        setLoading(false);
      }
    }
    fetchFaculty();
  }, [facultyId, router]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
  }

  if (!faculty) return null;

  return (
    <div className="space-y-8 pb-12 mt-12">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push("/admin/dashboard/faculty")} className="shrink-0 p-2 h-auto rounded-xl">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Faculty Profile</h2>
          <p className="text-slate-500">Manage records and view statistics for {faculty.name || "this faculty"}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-slate-50 shadow-sm overflow-hidden relative bg-slate-100 flex items-center justify-center shrink-0">
          {faculty.photoUrl ? (
            <Image src={faculty.photoUrl} alt="Profile" fill className="object-cover" />
          ) : (
            <User size={48} className="text-slate-300" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">{faculty.name || "Unnamed Faculty"}</h1>
          <div className="flex flex-wrap gap-4 text-slate-600">
            <span className="flex items-center gap-1.5"><Mail size={18} className="text-slate-400" /> {faculty.email}</span>
            {faculty.mobile && <span className="flex items-center gap-1.5"><Phone size={18} className="text-slate-400" /> {faculty.mobile}</span>}
            {faculty.subject && <span className="flex items-center gap-1.5"><BookOpen size={18} className="text-slate-400" /> {faculty.subject}</span>}
          </div>
        </div>
      </div>

      <FacultyLectureTracking facultyId={faculty.id} facultyName={faculty.name || faculty.email} />
    </div>
  );
}
