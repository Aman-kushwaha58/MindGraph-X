import React, { useState, useEffect } from 'react';
import { Sidebar, TabId } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { GraphPage } from './pages/GraphPage';
import { GapsPage } from './pages/GapsPage';
import { PlannerPage } from './pages/PlannerPage';
import { QuizPage } from './pages/QuizPage';
import { MentorPage } from './pages/MentorPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { TimelinePage } from './pages/TimelinePage';
import { EvaluationPage } from './pages/EvaluationPage';
import { AIToolsPage } from './pages/AIToolsPage';
import { AuthPage } from './pages/AuthPage';
import { api } from './services/api';
import { User } from './types';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { setTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);
  const [quizTargetConcept, setQuizTargetConcept] = useState<string>('Attention');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeDocTitle, setActiveDocTitle] = useState<string | null>(null);
  const [bottleneckCount, setBottleneckCount] = useState<number>(1);
  const [graphRefreshKey, setGraphRefreshKey] = useState<number>(0);
  const [voiceMode, setVoiceMode] = useState<boolean>(false);

  // Check existing session / verify token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const user = await api.getMe();
        setCurrentUser(user);
        if (user.theme_preference) {
          setTheme(user.theme_preference);
        }
        const b = await api.getBottlenecks();
        setBottleneckCount(b.length);
      } catch (e) {
        console.warn('Session verification failed, attempting silent refresh...');
        try {
          const refreshData = await api.refresh();
          setCurrentUser(refreshData.user);
          if (refreshData.user.theme_preference) {
            setTheme(refreshData.user.theme_preference);
          }
          const b = await api.getBottlenecks();
          setBottleneckCount(b.length);
        } catch (refreshErr) {
          api.clearToken();
          setCurrentUser(null);
        }
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    const handleLogoutEvent = () => {
      setCurrentUser(null);
    };
    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, [setTheme]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.theme_preference) {
      setTheme(user.theme_preference);
    }
    api.getBottlenecks().then((b) => setBottleneckCount(b.length)).catch(console.error);
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setActiveTab('dashboard');
    setSelectedConcept(null);
  };

  const handleRefreshGraph = () => {
    setGraphRefreshKey((prev) => prev + 1);
    api.getBottlenecks().then((b) => {
      setBottleneckCount(b.length);
    }).catch(console.error);
  };

  const handleLaunchQuiz = (conceptName: string) => {
    setActiveDocId(null);
    setActiveDocTitle(null);
    setQuizTargetConcept(conceptName);
    setActiveTab('quiz');
  };

  const handleStartDocumentQuiz = (docId: string, docTitle: string, concepts: string[]) => {
    setActiveDocId(docId);
    setActiveDocTitle(docTitle);
    if (concepts && concepts.length > 0) {
      setQuizTargetConcept(concepts[0]);
    }
    setActiveTab('quiz');
  };

  const handleSelectConcept = (conceptName: string | null) => {
    setSelectedConcept(conceptName);
    if (conceptName && activeTab !== 'graph') {
      setActiveTab('graph');
    }
  };

  const getPageTitle = (tab: TabId) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Learning Intelligence Dashboard', subtitle: 'Continuous knowledge state modeling & predictive recommendations' };
      case 'graph':
        return { title: 'Semantic Knowledge Graph', subtitle: 'Brain-inspired force-directed graph with verified mastery coloring' };
      case 'gaps':
        return { title: 'Prerequisite Gap Analysis', subtitle: 'Recursive dependency traversal up to depth 4' };
      case 'planner':
        return { title: 'Personalized Revision Planner', subtitle: '20-minute focused cognitive slots with restorative breaks' };
      case 'mentor':
        return { title: 'Grounded AI Mentor', subtitle: 'Factual question answering strictly grounded in indexed literature' };
      case 'quiz':
        return { title: 'Diagnostic Verification Quiz', subtitle: 'Schema-validated MCQs with before/after state evaluation' };
      case 'ai-tools':
        return { title: 'AI Learning Tools Suite', subtitle: 'Multi-lens concept explainer, active recall flashcards, Socratic Feynman testing & formula decoding' };
      case 'documents':
        return { title: 'Research Corpus & Ingestion', subtitle: 'Automated 5-stage document chunking and vector indexing' };
      case 'timeline':
        return { title: 'Evolution History & Audit Log', subtitle: 'Chronological PostgreSQL event stream with delta metrics' };
      case 'evaluation':
        return { title: 'Scientific Evaluation Harness', subtitle: 'Empirical benchmark results across F1, calibration & precision' };
    }
  };

  const headerInfo = getPageTitle(activeTab);

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen bg-bg-primary items-center justify-center flex-col gap-3 select-none">
        <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-text-secondary">Verifying MindGraph X session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen bg-bg-primary text-text-primary font-sans overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'graph') setSelectedConcept(null);
        }}
        bottleneckCount={bottleneckCount}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Right Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-primary">
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onRefreshGraph={handleRefreshGraph}
          onNavigateToQuiz={() => handleLaunchQuiz('Attention')}
          onNavigateToUpload={() => setActiveTab('documents')}
          activeTab={activeTab}
          voiceMode={voiceMode}
          onToggleVoiceMode={() => setVoiceMode((prev) => !prev)}
        />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigateToQuiz={handleLaunchQuiz}
              onNavigateToConcept={handleSelectConcept}
              onNavigateToTab={(t) => setActiveTab(t)}
            />
          )}

          {activeTab === 'graph' && (
            <GraphPage
              key={graphRefreshKey}
              selectedConcept={selectedConcept}
              onSelectConcept={setSelectedConcept}
              onLaunchQuiz={handleLaunchQuiz}
            />
          )}

          {activeTab === 'gaps' && (
            <GapsPage
              onLaunchQuiz={handleLaunchQuiz}
              onSelectConcept={handleSelectConcept}
            />
          )}

          {activeTab === 'planner' && (
            <PlannerPage
              onLaunchQuiz={handleLaunchQuiz}
              onSelectConcept={handleSelectConcept}
            />
          )}

          {activeTab === 'quiz' && (
            <QuizPage
              conceptName={quizTargetConcept}
              activeDocId={activeDocId}
              activeDocTitle={activeDocTitle}
              onSelectConceptName={setQuizTargetConcept}
              onNavigateToGraph={() => setActiveTab('graph')}
              onNavigateToPlanner={() => setActiveTab('planner')}
              onRefreshGraph={handleRefreshGraph}
            />
          )}

          {activeTab === 'ai-tools' && (
            <AIToolsPage
              onLaunchQuiz={handleLaunchQuiz}
              onSelectConcept={handleSelectConcept}
            />
          )}

          {activeTab === 'mentor' && (
            <MentorPage
              onSelectConcept={handleSelectConcept}
              voiceMode={voiceMode}
              onToggleVoiceMode={() => setVoiceMode((prev) => !prev)}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsPage
              onRefreshGraph={handleRefreshGraph}
              onNavigateToGraph={() => setActiveTab('graph')}
              onStartDocumentQuiz={handleStartDocumentQuiz}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelinePage onSelectConcept={handleSelectConcept} />
          )}

          {activeTab === 'evaluation' && <EvaluationPage />}
        </main>
      </div>
    </div>
  );
}
