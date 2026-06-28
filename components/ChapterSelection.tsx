import React from 'react';
import { Chapter, Subject, ClassLevel, User, SystemSettings } from '../types';
import { BookOpen, ChevronRight, CheckCircle, PlayCircle, Clock, AlertCircle } from 'lucide-react';
import { getChapterData } from '../firebase';

interface Props {
  chapters: Chapter[];
  subject: Subject;
  classLevel: ClassLevel;
  loading: boolean;
  user: User | null;
  settings?: SystemSettings;
  onSelect: (chapter: Chapter, contentType?: ContentType) => void;
  onBack: () => void;
}

export const ChapterSelection: React.FC<Props> = ({ 
  chapters, 
  subject, 
  classLevel, 
  loading, 
  user,
  settings: propSettings,
  onSelect, 
  onBack 
}) => {
  
  // Get settings from local storage directly if not passed prop, or assume App passes settings in real app structure
  // Ideally this component should receive settings as prop, but I'll read from localStorage for consistency with other deep components if prop isn't available
  // Or better, let's just read from localStorage here as a fallback since App.tsx might not be passing it down yet
  let settings: SystemSettings | null = propSettings || null;
  if (!settings) {
      try {
          const s = localStorage.getItem('nst_system_settings');
          if (s) settings = JSON.parse(s);
      } catch(e){}
  }

  // Get current progress for this subject
  const userProgress = user?.progress?.[subject.id] || { currentChapterIndex: 0, totalMCQsSolved: 0 };
  const isAdmin = user?.role === 'ADMIN';

  const [availability, setAvailability] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
      const checkAll = async () => {
          if (!user) return;
          const statuses: Record<string, boolean> = {};
          // Parallel fetch might be heavy, but for 15 items it's fine for Firebase
          await Promise.all(chapters.map(async (ch) => {
              const streamKey = (classLevel === '11' || classLevel === '12') && user.stream ? `-${user.stream}` : '';
              const key = `nst_content_${user.board || 'CBSE'}_${classLevel}${streamKey}_${subject.name}_${ch.id}`;
              let data = await getChapterData(key);
              // Fallback to local storage
              if (!data) {
                  try {
                      const local = localStorage.getItem(key);
                      if (local) data = JSON.parse(local);
                  } catch(e){}
              }

              if (data && (
                  (data.videoPlaylist && data.videoPlaylist.length > 0) || 
                  (data.schoolVideoPlaylist && data.schoolVideoPlaylist.length > 0) ||
                  (data.competitionVideoPlaylist && data.competitionVideoPlaylist.length > 0) ||
                  data.premiumVideoLink || 
                  data.freeVideoLink || 
                  data.freeLink ||
                  data.premiumLink ||
                  data.schoolPdfLink ||
                  data.competitionPdfLink ||
                  (data.manualMcqData && data.manualMcqData.length > 0)
              )) {
                  statuses[ch.id] = true;
              } else {
                  statuses[ch.id] = false;
              }
          }));
          setAvailability(statuses);
      };
      if (chapters.length > 0) checkAll();
  }, [chapters, subject, classLevel, user]);

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-4xl mx-auto">
       <div className="flex items-center mb-8 sticky top-0 bg-slate-50 py-4 z-10">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 transition-colors mr-4 font-medium flex items-center gap-1">
           Back
        </button>
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
             <span>Class {classLevel}</span>
             <span>/</span>
             <span className="font-medium text-slate-700">{subject.name}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Syllabus & Chapters</h2>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
             <div key={i} className="h-24 bg-white rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {chapters
            .filter(ch => !settings?.hiddenChapters?.includes(ch.id))
            .map((chapter, index) => {
            const isAvailable = availability[chapter.id];

            return (
              <div
                key={chapter.id}
                onClick={() => onSelect(chapter)}
                className="w-full p-5 rounded-xl border transition-all text-left flex items-center group relative overflow-hidden bg-white border-slate-200 hover:border-blue-300 cursor-pointer"
              >
                {/* Availability Label */}
                <div className="absolute top-2 right-2 z-10">
                    {isAvailable ? (
                        <span className="text-[9px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-green-200">
                            <CheckCircle size={10} /> Available
                        </span>
                    ) : (
                        <span className="text-[9px] font-bold bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full flex items-center gap-1 border border-orange-100">
                            <Clock size={10} /> In Progress
                        </span>
                    )}
                </div>

                {/* Status Indicator Bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>

                <div className="mr-5 ml-2 min-w-[3.5rem] flex flex-col items-center">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CH</span>
                   <span className="text-2xl font-bold text-slate-700">
                       {(index + 1).toString().padStart(2, '0')}
                   </span>
                </div>
                
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-slate-800">
                          {chapter.title}
                      </h3>
                  </div>
                </div>

                <div className="ml-2">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <PlayCircle size={20} />
                  </div>
                </div>
              </div>
            );
          })}
          
          {chapters.length === 0 && !loading && (
             <div className="text-center py-20 text-slate-400">
                <BookOpen size={48} className="mx-auto mb-4 opacity-50"/>
                <p>No chapters found. Please try refreshing.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};