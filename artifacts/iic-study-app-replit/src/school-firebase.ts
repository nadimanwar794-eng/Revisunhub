// IIC×NSTA Smart School Ecosystem — Firebase CRUD Helpers
import {
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot, Timestamp, writeBatch
} from "firebase/firestore";
import { ref, set, get, onValue, update, remove } from "firebase/database";
import { db, rtdb } from "./firebase";

const withTimeout = <T>(promise: Promise<T>, ms = 3000, fallbackVal?: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve, reject) =>
      setTimeout(() => {
        if (fallbackVal !== undefined) resolve(fallbackVal);
        else reject(new Error(`Operation timed out after ${ms}ms`));
      }, ms)
    )
  ]);
};

const sanitizeForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = sanitizeForFirestore(v);
  }
  return out;
};
import type {
  School, SchoolSession, SchoolClass, SchoolSubject, SchoolLesson,
  SchoolTeacher, SchoolStudent, AttendanceRecord, ExamEntry, MonthlyFee,
  SchoolHomework, SchoolMCQResult, SchoolUserProfile
} from "./school-types";

const col = (path: string) => collection(db, path);
const d = (path: string) => doc(db, path);

// ── SCHOOLS LOCAL CACHE ───────────────────────────────────────────────────────
const LOCAL_SCHOOLS_KEY = "nst_schools_local_cache";

export const getLocalSchools = (): School[] => {
  try {
    const raw = localStorage.getItem(LOCAL_SCHOOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const setLocalSchools = (schools: School[]) => {
  try {
    localStorage.setItem(LOCAL_SCHOOLS_KEY, JSON.stringify(schools));
  } catch {}
};

// ── SCHOOLS ──────────────────────────────────────────────────────────────────

export const saveSchool = async (school: School) => {
  const sanitized = sanitizeForFirestore(school);

  // 1. Instantly store in local cache so UI is responsive in 0ms
  const current = getLocalSchools();
  const next = [sanitized, ...current.filter((s: any) => s.id !== school.id)];
  setLocalSchools(next);

  // 2. Fast dual-save to RTDB (realtime websocket, fast & reliable)
  if (rtdb) {
    try {
      await withTimeout(set(ref(rtdb, `schools/${school.id}`), sanitized), 2500);
    } catch (e) {
      console.warn("[school-firebase] RTDB saveSchool:", e);
    }
  }

  // 3. Save to Firestore with timeout so operation never hangs
  if (db) {
    try {
      await withTimeout(setDoc(d(`schools/${school.id}`), sanitized), 3000);
    } catch (e) {
      console.warn("[school-firebase] Firestore saveSchool timed out or offline:", e);
    }
  }

  return sanitized;
};

export const getSchool = async (schoolId: string): Promise<School | null> => {
  const local = getLocalSchools().find(s => s.id === schoolId);
  if (local) return local;

  if (rtdb) {
    try {
      const snap = await withTimeout(get(ref(rtdb, `schools/${schoolId}`)), 2000);
      const val = (snap as any)?.val?.();
      if (val) return val as School;
    } catch {}
  }

  if (db) {
    try {
      const snap = await withTimeout(getDoc(d(`schools/${schoolId}`)), 2500);
      if (snap.exists()) return snap.data() as School;
    } catch {}
  }

  return null;
};

export const getAllSchools = async (): Promise<School[]> => {
  const local = getLocalSchools();

  if (rtdb) {
    try {
      const snap = await withTimeout(get(ref(rtdb, "schools")), 2000);
      const val = (snap as any)?.val?.();
      if (val && typeof val === "object") {
        const list: School[] = Object.values(val);
        if (list.length > 0) {
          setLocalSchools(list);
          return list;
        }
      }
    } catch {}
  }

  if (db) {
    try {
      const snap = await withTimeout(getDocs(col("schools")), 2500);
      const list = (snap as any).docs.map((d: any) => d.data() as School);
      if (list.length > 0) {
        setLocalSchools(list);
        return list;
      }
    } catch {}
  }

  return local;
};

export const subscribeToSchool = (schoolId: string, cb: (s: School | null) => void) => {
  const local = getLocalSchools().find(s => s.id === schoolId);
  if (local) cb(local);

  let rtdbUnsub: any = null;
  if (rtdb) {
    try {
      rtdbUnsub = onValue(ref(rtdb, `schools/${schoolId}`), snap => {
        const val = snap.val();
        if (val) cb(val as School);
      });
    } catch {}
  }

  let fsUnsub: any = null;
  if (db) {
    try {
      fsUnsub = onSnapshot(
        d(`schools/${schoolId}`),
        snap => cb(snap.exists() ? snap.data() as School : null),
        err => { console.warn(`[school-firebase] subscribeToSchool error:`, err?.code || err); }
      );
    } catch {}
  }

  return () => {
    if (typeof fsUnsub === "function") fsUnsub();
    if (typeof rtdbUnsub === "function") rtdbUnsub();
  };
};

export const subscribeToAllSchools = (
  cb: (schools: School[]) => void,
  onError?: (err: Error) => void
) => {
  // Deliver local cache first so UI is immediately populated
  const local = getLocalSchools();
  if (local.length > 0) {
    cb(local);
  }

  let rtdbUnsub: any = null;
  if (rtdb) {
    try {
      rtdbUnsub = onValue(
        ref(rtdb, "schools"),
        snap => {
          const val = snap.val();
          if (val && typeof val === "object") {
            const list: School[] = Object.values(val);
            if (list.length > 0) {
              setLocalSchools(list);
              cb(list);
            }
          }
        },
        err => console.warn(`[school-firebase] RTDB subscribeToAllSchools error:`, err)
      );
    } catch {}
  }

  let fsUnsub: any = null;
  if (db) {
    try {
      fsUnsub = onSnapshot(
        col("schools"),
        snap => {
          if (!snap.empty) {
            const list = snap.docs.map(d => d.data() as School);
            setLocalSchools(list);
            cb(list);
          }
        },
        err => {
          console.warn(`[school-firebase] subscribeToAllSchools Firestore error:`, err?.code || err);
          const current = getLocalSchools();
          if (current.length > 0) cb(current);
          onError?.(err);
        }
      );
    } catch {}
  }

  return () => {
    if (typeof fsUnsub === "function") fsUnsub();
    if (typeof rtdbUnsub === "function") rtdbUnsub();
  };
};

export const updateSchool = async (schoolId: string, data: Partial<School>) => {
  const sanitized = sanitizeForFirestore(data);

  // Local cache
  const current = getLocalSchools();
  const next = current.map(s => s.id === schoolId ? { ...s, ...sanitized } : s);
  setLocalSchools(next);

  // RTDB
  if (rtdb) {
    try {
      await withTimeout(update(ref(rtdb, `schools/${schoolId}`), sanitized), 2500);
    } catch {}
  }

  // Firestore
  if (db) {
    try {
      await withTimeout(updateDoc(d(`schools/${schoolId}`), sanitized), 3000);
    } catch {}
  }
};

export const lockSchool = async (schoolId: string, locked: boolean) => {
  await updateSchool(schoolId, { locked });
};

export const deleteSchool = async (schoolId: string) => {
  const current = getLocalSchools();
  setLocalSchools(current.filter(s => s.id !== schoolId));

  if (rtdb) {
    try {
      await withTimeout(remove(ref(rtdb, `schools/${schoolId}`)), 2000);
    } catch {}
  }

  if (db) {
    try {
      await withTimeout(deleteDoc(d(`schools/${schoolId}`)), 2500);
    } catch {}
  }
};

// ── SESSIONS ─────────────────────────────────────────────────────────────────

export const saveSession = async (session: SchoolSession) => {
  const sanitized = sanitizeForFirestore(session);
  if (rtdb) {
    try { await withTimeout(set(ref(rtdb, `schools/${session.schoolId}/sessions/${session.id}`), sanitized), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(setDoc(d(`schools/${session.schoolId}/sessions/${session.id}`), sanitized), 3000); } catch {}
  }
};

export const getSessions = async (schoolId: string): Promise<SchoolSession[]> => {
  if (rtdb) {
    try {
      const snap = await withTimeout(get(ref(rtdb, `schools/${schoolId}/sessions`)), 2000);
      const val = (snap as any)?.val?.();
      if (val && typeof val === "object") return Object.values(val);
    } catch {}
  }
  try {
    const snap = await withTimeout(getDocs(col(`schools/${schoolId}/sessions`)), 2500);
    return (snap as any).docs.map((doc: any) => doc.data() as SchoolSession);
  } catch {
    return [];
  }
};

export const subscribeToSessions = (schoolId: string, cb: (sessions: SchoolSession[]) => void) => {
  let rtdbUnsub: any = null;
  if (rtdb) {
    try {
      rtdbUnsub = onValue(ref(rtdb, `schools/${schoolId}/sessions`), snap => {
        const val = snap.val();
        if (val && typeof val === "object") cb(Object.values(val));
      });
    } catch {}
  }
  let fsUnsub: any = null;
  if (db) {
    try {
      fsUnsub = onSnapshot(
        col(`schools/${schoolId}/sessions`),
        snap => cb(snap.docs.map(doc => doc.data() as SchoolSession)),
        err => { console.warn(`[school-firebase] subscribeToSessions error:`, err?.code || err); }
      );
    } catch {}
  }
  return () => {
    if (typeof fsUnsub === "function") fsUnsub();
    if (typeof rtdbUnsub === "function") rtdbUnsub();
  };
};

export const updateSession = async (schoolId: string, sessionId: string, data: Partial<SchoolSession>) => {
  const sanitized = sanitizeForFirestore(data);
  if (rtdb) {
    try { await withTimeout(update(ref(rtdb, `schools/${schoolId}/sessions/${sessionId}`), sanitized), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(updateDoc(d(`schools/${schoolId}/sessions/${sessionId}`), sanitized), 3000); } catch {}
  }
};

export const deleteSession = async (schoolId: string, sessionId: string) => {
  if (rtdb) {
    try { await withTimeout(remove(ref(rtdb, `schools/${schoolId}/sessions/${sessionId}`)), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(deleteDoc(d(`schools/${schoolId}/sessions/${sessionId}`)), 2500); } catch {}
  }
};

// ── CLASSES ──────────────────────────────────────────────────────────────────

export const saveClass = async (cls: SchoolClass) => {
  const sanitized = sanitizeForFirestore(cls);
  if (rtdb) {
    try { await withTimeout(set(ref(rtdb, `schools/${cls.schoolId}/classes/${cls.id}`), sanitized), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(setDoc(d(`schools/${cls.schoolId}/classes/${cls.id}`), sanitized), 3000); } catch {}
  }
};

export const getClasses = async (schoolId: string, sessionId?: string): Promise<SchoolClass[]> => {
  if (rtdb) {
    try {
      const snap = await withTimeout(get(ref(rtdb, `schools/${schoolId}/classes`)), 2000);
      const val = (snap as any)?.val?.();
      if (val && typeof val === "object") {
        const all: SchoolClass[] = Object.values(val);
        return sessionId ? all.filter(c => c.sessionId === sessionId) : all;
      }
    } catch {}
  }
  try {
    const snap = await withTimeout(getDocs(col(`schools/${schoolId}/classes`)), 2500);
    const all = (snap as any).docs.map((doc: any) => doc.data() as SchoolClass);
    return sessionId ? all.filter((c: any) => c.sessionId === sessionId) : all;
  } catch {
    return [];
  }
};

export const subscribeToClasses = (schoolId: string, sessionId: string, cb: (classes: SchoolClass[]) => void) => {
  let rtdbUnsub: any = null;
  if (rtdb) {
    try {
      rtdbUnsub = onValue(ref(rtdb, `schools/${schoolId}/classes`), snap => {
        const val = snap.val();
        if (val && typeof val === "object") {
          const all: SchoolClass[] = Object.values(val);
          cb(all.filter(c => c.sessionId === sessionId));
        }
      });
    } catch {}
  }
  let fsUnsub: any = null;
  if (db) {
    try {
      fsUnsub = onSnapshot(
        query(col(`schools/${schoolId}/classes`), where("sessionId", "==", sessionId)),
        snap => cb(snap.docs.map(doc => doc.data() as SchoolClass)),
        err => { console.warn(`[school-firebase] subscribeToClasses error:`, err?.code || err); }
      );
    } catch {}
  }
  return () => {
    if (typeof fsUnsub === "function") fsUnsub();
    if (typeof rtdbUnsub === "function") rtdbUnsub();
  };
};

export const updateClass = async (schoolId: string, classId: string, data: Partial<SchoolClass>) => {
  const sanitized = sanitizeForFirestore(data);
  if (rtdb) {
    try { await withTimeout(update(ref(rtdb, `schools/${schoolId}/classes/${classId}`), sanitized), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(updateDoc(d(`schools/${schoolId}/classes/${classId}`), sanitized), 3000); } catch {}
  }
};

export const deleteClass = async (schoolId: string, classId: string) => {
  if (rtdb) {
    try { await withTimeout(remove(ref(rtdb, `schools/${schoolId}/classes/${classId}`)), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(deleteDoc(d(`schools/${schoolId}/classes/${classId}`)), 2500); } catch {}
  }
};

// ── SUBJECTS ─────────────────────────────────────────────────────────────────

export const saveSubject = async (subject: SchoolSubject) => {
  const sanitized = sanitizeForFirestore(subject);
  if (rtdb) {
    try { await withTimeout(set(ref(rtdb, `schools/${subject.schoolId}/subjects/${subject.id}`), sanitized), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(setDoc(d(`schools/${subject.schoolId}/subjects/${subject.id}`), sanitized), 3000); } catch {}
  }
};

export const getSubjects = async (schoolId: string, classId?: string): Promise<SchoolSubject[]> => {
  if (rtdb) {
    try {
      const snap = await withTimeout(get(ref(rtdb, `schools/${schoolId}/subjects`)), 2000);
      const val = (snap as any)?.val?.();
      if (val && typeof val === "object") {
        const all: SchoolSubject[] = Object.values(val);
        return classId ? all.filter(s => s.classId === classId) : all;
      }
    } catch {}
  }
  try {
    const snap = await withTimeout(getDocs(col(`schools/${schoolId}/subjects`)), 2500);
    const all = (snap as any).docs.map((doc: any) => doc.data() as SchoolSubject);
    return classId ? all.filter((s: any) => s.classId === classId) : all;
  } catch {
    return [];
  }
};

export const subscribeToSubjects = (schoolId: string, classId: string, cb: (subjects: SchoolSubject[]) => void) =>
  onSnapshot(
    query(col(`schools/${schoolId}/subjects`), where("classId", "==", classId)),
    snap => cb(snap.docs.map(d => d.data() as SchoolSubject)),
    err => { console.warn(`[school-firebase] subscribeToSubjects error:`, err?.code || err); cb([]); }
  );

export const deleteSubject = async (schoolId: string, subjectId: string) => {
  if (rtdb) {
    try { await withTimeout(remove(ref(rtdb, `schools/${schoolId}/subjects/${subjectId}`)), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(deleteDoc(d(`schools/${schoolId}/subjects/${subjectId}`)), 2500); } catch {}
  }
};

// ── LESSONS ──────────────────────────────────────────────────────────────────

export const saveLesson = async (lesson: SchoolLesson) => {
  const sanitized = sanitizeForFirestore(lesson);
  if (rtdb) {
    try { await withTimeout(set(ref(rtdb, `schools/${lesson.schoolId}/lessons/${lesson.id}`), sanitized), 2500); } catch {}
  }
  if (db) {
    try { await withTimeout(setDoc(d(`schools/${lesson.schoolId}/lessons/${lesson.id}`), sanitized), 3000); } catch {}
  }
};

export const getLessons = async (schoolId: string, subjectId?: string): Promise<SchoolLesson[]> => {
  try {
    const snap = await withTimeout(getDocs(col(`schools/${schoolId}/lessons`)), 2500);
    const all = (snap as any).docs.map((doc: any) => doc.data() as SchoolLesson);
    return subjectId ? all.filter((l: any) => l.subjectId === subjectId) : all;
  } catch {
    return [];
  }
};

export const subscribeToLessons = (schoolId: string, subjectId: string, cb: (lessons: SchoolLesson[]) => void) =>
  onSnapshot(
    query(col(`schools/${schoolId}/lessons`), where("subjectId", "==", subjectId)),
    snap => cb(snap.docs.map(d => d.data() as SchoolLesson).sort((a, b) => a.order - b.order)),
    err => { console.warn(`[school-firebase] subscribeToLessons error:`, err?.code || err); cb([]); }
  );

export const updateLesson = async (schoolId: string, lessonId: string, data: Partial<SchoolLesson>) => {
  const sanitized = sanitizeForFirestore(data);
  if (rtdb) {
    try { await withTimeout(update(ref(rtdb, `schools/${schoolId}/lessons/${lessonId}`), sanitized), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(updateDoc(d(`schools/${schoolId}/lessons/${lessonId}`), sanitized), 3000); } catch {}
  }
};

export const deleteLesson = async (schoolId: string, lessonId: string) => {
  if (rtdb) {
    try { await withTimeout(remove(ref(rtdb, `schools/${schoolId}/lessons/${lessonId}`)), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(deleteDoc(d(`schools/${schoolId}/lessons/${lessonId}`)), 2500); } catch {}
  }
};

// ── TEACHERS ─────────────────────────────────────────────────────────────────

export const saveTeacher = async (teacher: SchoolTeacher) => {
  const sanitized = sanitizeForFirestore(teacher);
  if (rtdb) {
    try { await withTimeout(set(ref(rtdb, `schools/${teacher.schoolId}/teachers/${teacher.id}`), sanitized), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(setDoc(d(`schools/${teacher.schoolId}/teachers/${teacher.id}`), sanitized), 3000); } catch {}
  }
};

export const getTeachers = async (schoolId: string): Promise<SchoolTeacher[]> => {
  try {
    const snap = await withTimeout(getDocs(col(`schools/${schoolId}/teachers`)), 2500);
    return (snap as any).docs.map((doc: any) => doc.data() as SchoolTeacher);
  } catch {
    return [];
  }
};

export const subscribeToTeachers = (schoolId: string, cb: (teachers: SchoolTeacher[]) => void) =>
  onSnapshot(
    col(`schools/${schoolId}/teachers`),
    snap => cb(snap.docs.map(d => d.data() as SchoolTeacher)),
    err => { console.warn(`[school-firebase] subscribeToTeachers error:`, err?.code || err); cb([]); }
  );

export const updateTeacher = async (schoolId: string, teacherId: string, data: Partial<SchoolTeacher>) => {
  const sanitized = sanitizeForFirestore(data);
  if (rtdb) {
    try { await withTimeout(update(ref(rtdb, `schools/${schoolId}/teachers/${teacherId}`), sanitized), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(updateDoc(d(`schools/${schoolId}/teachers/${teacherId}`), sanitized), 3000); } catch {}
  }
};

export const deleteTeacher = async (schoolId: string, teacherId: string) => {
  if (rtdb) {
    try { await withTimeout(remove(ref(rtdb, `schools/${schoolId}/teachers/${teacherId}`)), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(deleteDoc(d(`schools/${schoolId}/teachers/${teacherId}`)), 2500); } catch {}
  }
};

// ── STUDENTS ─────────────────────────────────────────────────────────────────

export const saveStudent = async (student: SchoolStudent) => {
  const sanitized = sanitizeForFirestore(student);
  if (rtdb) {
    try { await withTimeout(set(ref(rtdb, `schools/${student.schoolId}/students/${student.id}`), sanitized), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(setDoc(d(`schools/${student.schoolId}/students/${student.id}`), sanitized), 3000); } catch {}
  }
};

export const getStudents = async (schoolId: string, classId?: string): Promise<SchoolStudent[]> => {
  try {
    const snap = await withTimeout(getDocs(col(`schools/${schoolId}/students`)), 2500);
    const all = (snap as any).docs.map((doc: any) => doc.data() as SchoolStudent).filter((s: any) => s.active);
    return classId ? all.filter((s: any) => s.classId === classId) : all;
  } catch {
    return [];
  }
};

export const subscribeToStudents = (schoolId: string, classId: string, cb: (students: SchoolStudent[]) => void) =>
  onSnapshot(
    query(col(`schools/${schoolId}/students`), where("classId", "==", classId), where("active", "==", true)),
    snap => cb(snap.docs.map(d => d.data() as SchoolStudent).sort((a, b) => a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true }))),
    err => { console.warn(`[school-firebase] subscribeToStudents error:`, err?.code || err); cb([]); }
  );

export const subscribeToAllStudents = (schoolId: string, cb: (students: SchoolStudent[]) => void) =>
  onSnapshot(
    query(col(`schools/${schoolId}/students`), where("active", "==", true)),
    snap => cb(snap.docs.map(d => d.data() as SchoolStudent)),
    err => { console.warn(`[school-firebase] subscribeToAllStudents error:`, err?.code || err); cb([]); }
  );

export const updateStudent = async (schoolId: string, studentId: string, data: Partial<SchoolStudent>) => {
  const sanitized = sanitizeForFirestore(data);
  if (rtdb) {
    try { await withTimeout(update(ref(rtdb, `schools/${schoolId}/students/${studentId}`), sanitized), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(updateDoc(d(`schools/${schoolId}/students/${studentId}`), sanitized), 3000); } catch {}
  }
};

export const deleteStudent = async (schoolId: string, studentId: string) => {
  if (rtdb) {
    try { await withTimeout(update(ref(rtdb, `schools/${schoolId}/students/${studentId}`), { active: false }), 2000); } catch {}
  }
  if (db) {
    try { await withTimeout(updateDoc(d(`schools/${schoolId}/students/${studentId}`), { active: false }), 2500); } catch {}
  }
};

// ── ATTENDANCE ───────────────────────────────────────────────────────────────

export const saveAttendance = async (record: AttendanceRecord) => {
  const id = `${record.classId}_${record.date}`;
  await setDoc(
    d(`schools/${record.schoolId}/attendance/${id}`),
    sanitizeForFirestore(record)
  );
};

export const getAttendance = async (schoolId: string, classId: string, date: string): Promise<AttendanceRecord | null> => {
  const id = `${classId}_${date}`;
  const snap = await getDoc(d(`schools/${schoolId}/attendance/${id}`));
  return snap.exists() ? snap.data() as AttendanceRecord : null;
};

export const getMonthlyAttendance = async (schoolId: string, classId: string, month: string): Promise<AttendanceRecord[]> => {
  const snap = await getDocs(col(`schools/${schoolId}/attendance`));
  return snap.docs
    .map(d => d.data() as AttendanceRecord)
    .filter(r => r.classId === classId && r.date.startsWith(month));
};

export const subscribeToAttendance = (
  schoolId: string, classId: string, date: string, cb: (r: AttendanceRecord | null) => void
) => {
  const id = `${classId}_${date}`;
  return onSnapshot(
    d(`schools/${schoolId}/attendance/${id}`),
    snap => cb(snap.exists() ? snap.data() as AttendanceRecord : null),
    err => { console.warn(`[school-firebase] subscribeToAttendance error:`, err?.code || err); cb(null); }
  );
};

// ── MARKS / EXAMS ────────────────────────────────────────────────────────────

export const saveExam = async (exam: ExamEntry) => {
  await setDoc(d(`schools/${exam.schoolId}/exams/${exam.id}`), sanitizeForFirestore(exam));
};

export const getExams = async (schoolId: string, classId?: string): Promise<ExamEntry[]> => {
  const snap = await getDocs(col(`schools/${schoolId}/exams`));
  const all = snap.docs.map(d => d.data() as ExamEntry);
  return classId ? all.filter(e => e.classId === classId) : all;
};

export const subscribeToExams = (schoolId: string, classId: string, cb: (exams: ExamEntry[]) => void) =>
  onSnapshot(
    query(col(`schools/${schoolId}/exams`), where("classId", "==", classId)),
    snap => cb(snap.docs.map(d => d.data() as ExamEntry)),
    err => { console.warn(`[school-firebase] subscribeToExams error:`, err?.code || err); cb([]); }
  );

export const deleteExam = async (schoolId: string, examId: string) => {
  await deleteDoc(d(`schools/${schoolId}/exams/${examId}`));
};

// ── FEE ─────────────────────────────────────────────────────────────────────

export const saveFee = async (fee: MonthlyFee) => {
  const id = `${fee.studentId}_${fee.month}`;
  await setDoc(d(`schools/${fee.schoolId}/fees/${id}`), sanitizeForFirestore(fee));
};

export const getStudentFees = async (schoolId: string, studentId: string): Promise<MonthlyFee[]> => {
  const snap = await getDocs(col(`schools/${schoolId}/fees`));
  return snap.docs
    .map(d => d.data() as MonthlyFee)
    .filter(f => f.studentId === studentId)
    .sort((a, b) => b.month.localeCompare(a.month));
};

export const getMonthlyFees = async (schoolId: string, month: string, classId?: string): Promise<MonthlyFee[]> => {
  const snap = await getDocs(col(`schools/${schoolId}/fees`));
  let all = snap.docs.map(d => d.data() as MonthlyFee).filter(f => f.month === month);
  if (classId) all = all.filter(f => f.classId === classId);
  return all.sort((a, b) => a.studentName.localeCompare(b.studentName));
};

export const subscribeToClassFees = (schoolId: string, month: string, classId: string, cb: (fees: MonthlyFee[]) => void) =>
  onSnapshot(
    query(col(`schools/${schoolId}/fees`), where("month", "==", month), where("classId", "==", classId)),
    snap => cb(snap.docs.map(d => d.data() as MonthlyFee)),
    err => { console.warn(`[school-firebase] subscribeToClassFees error:`, err?.code || err); cb([]); }
  );

export const markFeePaid = async (schoolId: string, studentId: string, month: string, paidBy: string) => {
  const id = `${studentId}_${month}`;
  await updateDoc(d(`schools/${schoolId}/fees/${id}`), sanitizeForFirestore({
    paid: true,
    paidDate: new Date().toISOString(),
    paidBy,
    receiptNo: `RCP-${Date.now()}`
  }));
};

// ── HOMEWORK ─────────────────────────────────────────────────────────────────

export const saveHomework = async (hw: SchoolHomework) => {
  await setDoc(d(`schools/${hw.schoolId}/homework/${hw.id}`), sanitizeForFirestore(hw));
};

export const getHomework = async (schoolId: string, classId: string): Promise<SchoolHomework[]> => {
  const snap = await getDocs(col(`schools/${schoolId}/homework`));
  return snap.docs
    .map(d => d.data() as SchoolHomework)
    .filter(h => h.classId === classId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

// ── MCQ RESULTS (school) ─────────────────────────────────────────────────────

export const saveSchoolMCQResult = async (result: SchoolMCQResult) => {
  await setDoc(d(`schools/${result.schoolId}/mcq_results/${result.id}`), sanitizeForFirestore(result));
};

export const getClassMCQResults = async (schoolId: string, classId: string): Promise<SchoolMCQResult[]> => {
  const snap = await getDocs(col(`schools/${schoolId}/mcq_results`));
  return snap.docs
    .map(d => d.data() as SchoolMCQResult)
    .filter(r => r.classId === classId)
    .sort((a, b) => b.date.localeCompare(a.date));
};

// ── SCHOOL USER PROFILE ──────────────────────────────────────────────────────

export const saveSchoolUserProfile = async (profile: SchoolUserProfile) => {
  await setDoc(d(`school_users/${profile.uid}`), sanitizeForFirestore(profile));
};

export const getSchoolUserProfile = async (uid: string): Promise<SchoolUserProfile | null> => {
  const snap = await getDoc(d(`school_users/${uid}`));
  return snap.exists() ? snap.data() as SchoolUserProfile : null;
};

export const subscribeToSchoolUserProfile = (uid: string, cb: (p: SchoolUserProfile | null) => void) =>
  onSnapshot(
    d(`school_users/${uid}`),
    snap => cb(snap.exists() ? snap.data() as SchoolUserProfile : null),
    err => { console.warn(`[school-firebase] subscribeToSchoolUserProfile error:`, err?.code || err); cb(null); }
  );

// ── LOCK CODE ────────────────────────────────────────────────────────────────

export const setSchoolLockCode = async (schoolId: string, lockCode: string, active: boolean) => {
  await updateDoc(d(`schools/${schoolId}`), sanitizeForFirestore({ lockCode, lockCodeActive: active }));
};

export const verifySchoolLockCode = async (schoolId: string, enteredCode: string): Promise<boolean> => {
  const snap = await getDoc(d(`schools/${schoolId}`));
  if (!snap.exists()) return false;
  const school = snap.data();
  if (!school.lockCodeActive || !school.lockCode) return true;
  return school.lockCode === enteredCode;
};

// ── ASSIGN SCHOOL ROLE BY EMAIL ───────────────────────────────────────────────
// Generic helper: looks up a user by email, creates/updates school_users/{uid}.
const assignSchoolRoleByEmail = async (
  schoolId: string,
  email: string,
  role: SchoolUserProfile['role'],
): Promise<SchoolUserProfile> => {
  const q = query(col('users'), where('email', '==', email.trim().toLowerCase()));
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error(`Koi user nahi mila email "${email}" se. Pehle woh IIC app mein register kare.`);
  }
  const userData = snap.docs[0].data();
  const uid: string = userData.id || snap.docs[0].id;
  if (!uid) throw new Error('User ka UID nahi mila. Support se contact karo.');

  const profile: SchoolUserProfile = {
    uid,
    schoolId,
    role,
    name: userData.name || userData.displayName || email,
    email: email.trim().toLowerCase(),
  };
  await setDoc(d(`school_users/${uid}`), sanitizeForFirestore(profile));
  return profile;
};

export const assignSchoolAdminByEmail = (schoolId: string, email: string) =>
  assignSchoolRoleByEmail(schoolId, email, 'SCHOOL_ADMIN');

export const assignSchoolSubAdminByEmail = (schoolId: string, email: string) =>
  assignSchoolRoleByEmail(schoolId, email, 'SCHOOL_SUB_ADMIN');

export const removeSchoolUserByUid = async (uid: string) => {
  await deleteDoc(d(`school_users/${uid}`));
};

export const getSchoolAdmins = async (schoolId: string): Promise<SchoolUserProfile[]> => {
  const q = query(col('school_users'), where('schoolId', '==', schoolId), where('role', 'in', ['SCHOOL_ADMIN', 'SCHOOL_SUB_ADMIN']));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as SchoolUserProfile);
};

// ── FEE ALL CLASSES ──────────────────────────────────────────────────────────

export const getAllMonthlyFees = async (schoolId: string, month: string): Promise<MonthlyFee[]> => {
  const snap = await getDocs(col(`schools/${schoolId}/fees`));
  return snap.docs.map(d => d.data() as MonthlyFee).filter(f => f.month === month);
};

// ── ACCOUNT LINKING ──────────────────────────────────────────────────────────
// Student fills their data → system matches against school students → links IIC UID

export const linkStudentAccount = async (
  schoolId: string,
  iicUid: string,
  iicName: string,
  rollNo: string,
  admissionNo: string,
  fatherName: string
): Promise<{ success: boolean; message: string; studentId?: string }> => {
  const snap = await getDocs(col(`schools/${schoolId}/students`));
  const allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  const normalize = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");

  // Match: name must match + (roll OR admission) must match
  const match = allStudents.find(s => {
    const nameMatch = normalize(s.name) === normalize(iicName) || normalize(s.name).startsWith(normalize(iicName.split(" ")[0]));
    const rollMatch = rollNo.trim() && normalize(s.rollNo) === normalize(rollNo);
    const admMatch = admissionNo.trim() && s.admissionNo && normalize(s.admissionNo) === normalize(admissionNo);
    const fatherMatch = fatherName.trim() && s.fatherName && normalize(s.fatherName) === normalize(fatherName);
    return nameMatch && (rollMatch || admMatch || fatherMatch);
  });

  if (!match) return { success: false, message: "Aapka record nahi mila. Name, Roll Number aur Father's Name dobara check karein." };
  if (match.iicUid && match.iicUid !== iicUid) return { success: false, message: "Yeh student record pehle se kisi aur account se link hai." };
  if (match.iicUid === iicUid) return { success: true, message: "Aapka account pehle se link hai!", studentId: match.id };

  await updateDoc(d(`schools/${schoolId}/students/${match.id}`), sanitizeForFirestore({ iicUid }));

  // Also create a school_users profile
  const profile: import('./school-types').SchoolUserProfile = {
    uid: iicUid,
    schoolId,
    role: 'SCHOOL_STUDENT',
    name: match.name,
    email: match.email || '',
    studentRef: match.id,
    classId: match.classId,
    sessionId: match.sessionId,
  };
  await setDoc(d(`school_users/${iicUid}`), sanitizeForFirestore(profile));

  return { success: true, message: "Account successfully link ho gaya! Ab aap school dashboard dekh sakte hain.", studentId: match.id };
};

// ── UTILITY ──────────────────────────────────────────────────────────────────

export const generateId = () => doc(collection(db, "_")).id;

export const todayStr = () => new Date().toISOString().split("T")[0];

export const currentMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
