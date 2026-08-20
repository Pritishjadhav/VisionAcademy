import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, Loader2, Calendar, X, Edit2 } from "lucide-react";
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import toast from "react-hot-toast";

interface ScheduleTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchName: string;
}

interface Timetable {
  id: string;
  batchId: string;
  date: string;
  subject: string;
  time: string;
  createdAt: string;
}

const PREDEFINED_SUBJECTS = ["Physics", "Chemistry", "Maths", "Biology", "English", "Geometry", "CS", "IT"];

export function ScheduleTimetableModal({ isOpen, onClose, batchName }: ScheduleTimetableModalProps) {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState("");
  const [lectures, setLectures] = useState([{ subject: "", startTime: "", endTime: "" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const formatTime12Hour = (time24: string) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const parseTime12Hour = (time12: string) => {
    if (!time12) return "";
    const [time, ampm] = time12.split(" ");
    if (!time || !ampm) return "";
    let [hours, minutes] = time.split(":");
    let h = parseInt(hours, 10);
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${minutes}`;
  };

  const groupedTimetables = timetables.reduce((acc, curr) => {
    if (!acc[curr.date]) {
      acc[curr.date] = [];
    }
    acc[curr.date].push(curr);
    return acc;
  }, {} as Record<string, Timetable[]>);

  const sortedDates = Object.keys(groupedTimetables).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  useEffect(() => {
    if (!isOpen) return;

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

    // We fetch all schedules for this batch and filter client-side to avoid composite index requirements
    const q = query(
      collection(db, "timetables"),
      where("batchId", "==", batchName)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Timetable[];

      // Automatically clean up expired timetables (lazy deletion)
      const expiredSchedules = data.filter(t => t.date < today);
      if (expiredSchedules.length > 0) {
        expiredSchedules.forEach(s => {
          deleteDoc(doc(db, "timetables", s.id)).catch(console.error);
        });
      }

      // Filter for today or future dates for UI display
      data = data.filter(t => t.date >= today);

      data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setTimetables(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, batchName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    // Validate all lectures
    const invalidLecture = lectures.find(l => !l.subject.trim() || !l.startTime || !l.endTime);
    if (invalidLecture) {
      toast.error("Please fill in all subject and time fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDate && groupedTimetables[editingDate]) {
        // Delete old schedules for the date being edited
        await Promise.all(groupedTimetables[editingDate].map(s => deleteDoc(doc(db, "timetables", s.id))));
        setEditingDate(null);
      }

      await Promise.all(lectures.map(lecture => {
        const formattedTime = `${formatTime12Hour(lecture.startTime)} - ${formatTime12Hour(lecture.endTime)}`;
        return addDoc(collection(db, "timetables"), {
          batchId: batchName,
          date,
          subject: lecture.subject,
          time: formattedTime,
          createdAt: new Date().toISOString()
        });
      }));
      toast.success("Timetable saved successfully!");
      setLectures([{ subject: "", startTime: "", endTime: "" }]);
      setDate("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add schedule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDate = async (dateToDelete: string) => {
    if (!confirm("Are you sure you want to delete all schedules for this date?")) return;
    try {
      const schedules = groupedTimetables[dateToDelete];
      await Promise.all(schedules.map(s => deleteDoc(doc(db, "timetables", s.id))));
      if (editingDate === dateToDelete) {
        setEditingDate(null);
        setDate("");
        setLectures([{ subject: "", startTime: "", endTime: "" }]);
      }
      toast.success("Schedules deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete schedules");
    }
  };

  const handleEditDate = (dateToEdit: string) => {
    const schedules = groupedTimetables[dateToEdit];
    setDate(dateToEdit);
    setEditingDate(dateToEdit);
    setLectures(schedules.map(s => {
      const [start, end] = s.time.split(" - ");
      return {
        subject: s.subject,
        startTime: parseTime12Hour(start),
        endTime: parseTime12Hour(end)
      };
    }));
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
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl pointer-events-auto relative flex flex-col max-h-[90vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-xl font-bold text-slate-900">
                  Schedule Timetable: {batchName}
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-700">
                      {editingDate ? "Edit Timetable" : "Add Timetable"}
                    </h3>
                    {editingDate && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDate(null);
                          setDate("");
                          setLectures([{ subject: "", startTime: "", endTime: "" }]);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
                      >
                        <X size={14} /> Cancel Edit
                      </button>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full sm:w-1/3 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none"
                      required
                      min={new Date().toLocaleDateString('en-CA')}
                    />
                  </div>

                  <div className="space-y-4 mb-4">
                    {lectures.map((lecture, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-4 p-4 bg-white border border-slate-200 rounded-xl">
                        <div className="w-full sm:w-24 shrink-0 pt-2">
                          <span className="text-sm font-bold text-slate-500">Lecture {index + 1}</span>
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                            <input
                              type="text"
                              value={lecture.subject}
                              onFocus={() => setActiveDropdown(index)}
                              onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                              onChange={(e) => {
                                const newLectures = [...lectures];
                                newLectures[index].subject = e.target.value;
                                setLectures(newLectures);
                              }}
                              placeholder="e.g. Physics"
                              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none relative z-20"
                              required
                              autoComplete="off"
                            />
                            <AnimatePresence>
                              {activeDropdown === index && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute z-[60] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto"
                                >
                                  {PREDEFINED_SUBJECTS.filter(s => s.toLowerCase().includes(lecture.subject.toLowerCase())).length > 0 ? (
                                    PREDEFINED_SUBJECTS.filter(s => s.toLowerCase().includes(lecture.subject.toLowerCase())).map(subject => (
                                      <div
                                        key={subject}
                                        onClick={() => {
                                          const newLectures = [...lectures];
                                          newLectures[index].subject = subject;
                                          setLectures(newLectures);
                                          setActiveDropdown(null);
                                        }}
                                        className="px-4 py-2 hover:bg-brand-blue/5 cursor-pointer text-sm text-slate-700 font-medium transition-colors"
                                      >
                                        {subject}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="px-4 py-3 text-xs text-slate-500 italic bg-slate-50 border-t border-slate-100">
                                      Custom subject will be saved
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={lecture.startTime}
                              onChange={(e) => {
                                const newLectures = [...lectures];
                                newLectures[index].startTime = e.target.value;
                                setLectures(newLectures);
                              }}
                              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                            <input
                              type="time"
                              value={lecture.endTime}
                              onChange={(e) => {
                                const newLectures = [...lectures];
                                newLectures[index].endTime = e.target.value;
                                setLectures(newLectures);
                              }}
                              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue outline-none"
                              required
                            />
                          </div>
                        </div>
                        {lectures.length > 1 && (
                          <div className="flex items-end pb-1">
                            <button
                              type="button"
                              onClick={() => {
                                const newLectures = [...lectures];
                                newLectures.splice(index, 1);
                                setLectures(newLectures);
                              }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLectures([...lectures, { subject: "", startTime: "", endTime: "" }])}
                      className="text-brand-blue border-brand-blue/20 hover:bg-brand-blue/5"
                    >
                      <Plus className="mr-2" size={16} /> Next Lecture
                    </Button>
                    <Button type="submit" variant="gradient" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                      Save Timetable
                    </Button>
                  </div>
                </form>

                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Calendar size={18} className="text-brand-blue" /> Upcoming Schedules
                  </h3>
                  {loading ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="animate-spin text-brand-blue" size={32} />
                    </div>
                  ) : timetables.length === 0 ? (
                    <div className="text-center p-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No upcoming schedules found for this batch.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {sortedDates.map((dateStr) => (
                        <div key={dateStr} className="flex flex-col sm:flex-row sm:items-start justify-between p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-shadow gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2.5 py-1 bg-brand-blue/10 text-brand-blue rounded-lg text-sm font-bold">
                                {new Date(dateStr).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-100 rounded-md">
                                {groupedTimetables[dateStr].length} Lecture{groupedTimetables[dateStr].length > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="space-y-1.5 pl-1">
                              {groupedTimetables[dateStr].map(schedule => (
                                <div key={schedule.id} className="text-sm flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                  <span className="font-semibold text-slate-700">{schedule.subject}</span>
                                  <span className="text-slate-400">·</span>
                                  <span className="text-slate-500">{schedule.time}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleEditDate(dateStr)}
                              className="p-2 text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-colors"
                              title="Edit Timetable"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteDate(dateStr)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Timetable"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
