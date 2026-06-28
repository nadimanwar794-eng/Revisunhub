
export interface FeatureDefinition {
    id: string;
    label: string;
    category: 'REVISION' | 'ANALYSIS' | 'CONTENT' | 'TOOLS' | 'GAMIFICATION' | 'OTHER';
    description: string;
}

export const ALL_FEATURES: FeatureDefinition[] = [
    // REVISION HUB
    { id: 'REVISION_HUB', label: 'Revision Hub Access', category: 'REVISION', description: 'Unlock the main Revision Hub dashboard.' },
    { id: 'REVISION_AI_PLAN', label: 'AI Study Plan', category: 'REVISION', description: 'Generate AI-based study plans in Revision Hub.' },
    { id: 'REVISION_MISTAKES', label: 'Mistakes Review', category: 'REVISION', description: 'Access detailed mistakes log from past tests.' },
    { id: 'REVISION_WEAK_TOPICS', label: 'Weak Topics', category: 'REVISION', description: 'Filter and focus on weak topics specifically.' },

    // ANALYSIS
    { id: 'ADVANCED_ANALYSIS', label: 'Advanced Analytics', category: 'ANALYSIS', description: 'Deep insights, progress graphs, and performance metrics.' },
    { id: 'MCQ_ANALYSIS_ULTRA', label: 'Ultra Analysis', category: 'ANALYSIS', description: 'AI-powered detailed breakdown of test performance.' },

    // CONTENT
    { id: 'MCQ_PRACTICE', label: 'MCQ Practice Mode', category: 'CONTENT', description: 'Access to unlimited MCQ practice sessions.' },
    { id: 'MCQ_TEST', label: 'Full Length Tests', category: 'CONTENT', description: 'Access to timed full-syllabus mock tests.' },
    { id: 'AUDIO_LIBRARY', label: 'Audio Library', category: 'CONTENT', description: 'Listen to audio lectures and podcasts.' },
    { id: 'COMPETITION_MODE', label: 'Competition Mode', category: 'CONTENT', description: 'Access high-level competition syllabus content.' },
    { id: 'VIDEO_ACCESS', label: 'Video Lectures', category: 'CONTENT', description: 'Watch premium video lectures.' },
    { id: 'NOTES_ACCESS', label: 'Premium Notes', category: 'CONTENT', description: 'Read premium PDF and HTML notes.' },

    // TOOLS & AI
    { id: 'AI_GENERATOR', label: 'AI Notes Generator', category: 'TOOLS', description: 'Generate custom notes using AI.' },
    { id: 'AI_CHAT', label: 'AI Tutor Chat', category: 'TOOLS', description: 'Chat with AI for doubt solving.' },
    { id: 'DOWNLOAD_PDF', label: 'Download PDFs', category: 'TOOLS', description: 'Save notes for offline viewing.' },

    // GAMIFICATION
    { id: 'GAMES', label: 'Spin Wheel & Games', category: 'GAMIFICATION', description: 'Access to daily games and rewards.' },
    { id: 'LEADERBOARD', label: 'Leaderboard', category: 'GAMIFICATION', description: 'View global rankings and compete.' },
];

export const FEATURE_CATEGORIES = Array.from(new Set(ALL_FEATURES.map(f => f.category)));
