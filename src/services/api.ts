/**
 * MindGraph X: Frontend API Service
 * Handles Bearer token, unified endpoints, and typed returns.
 */

import {
  User,
  HealthStatus,
  KnowledgeGraphData,
  ConceptDetailState,
  KnowledgeGap,
  BottleneckItem,
  RecommendationItem,
  QuizQuestion,
  MultiConceptQuizResponse,
  DocumentQuizSet,
  DocumentUploadResponse,
  DocumentProcessResponse,
  TodayPlan,
  TimelineEvent,
  MentorMessage,
  DashboardData,
  EvaluationData,
} from '../types';

const TOKEN_KEY = 'mindgraph_jwt_token';
const REFRESH_TOKEN_KEY = 'mindgraph_refresh_token';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'include', // sends refresh_token httpOnly cookie
    });

    // Silent 401 Token Refresh with Single Retry
    if (
      response.status === 401 &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/refresh') &&
      !endpoint.includes('/auth/signup') &&
      !endpoint.includes('/auth/register') &&
      !endpoint.includes('/auth/forgot-password') &&
      !endpoint.includes('/auth/verify-reset-token') &&
      !endpoint.includes('/auth/reset-password')
    ) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await this.refresh();
          isRefreshing = false;
          onRefreshed(refreshRes.access_token);

          // Retry original request once
          headers['Authorization'] = `Bearer ${refreshRes.access_token}`;
          const retryResponse = await fetch(endpoint, {
            ...options,
            headers,
            credentials: 'include',
          });

          if (!retryResponse.ok) {
            const errText = await retryResponse.text();
            throw new Error(errText || `HTTP Error ${retryResponse.status}`);
          }
          return retryResponse.json();
        } catch (refreshErr) {
          isRefreshing = false;
          this.clearToken();
          window.dispatchEvent(new CustomEvent('auth:logout'));
          throw new Error('Session expired. Please log in again.');
        }
      } else {
        return new Promise<T>((resolve, reject) => {
          subscribeTokenRefresh(async (newToken) => {
            try {
              headers['Authorization'] = `Bearer ${newToken}`;
              const retryResponse = await fetch(endpoint, {
                ...options,
                headers,
                credentials: 'include',
              });
              if (!retryResponse.ok) throw new Error(await retryResponse.text());
              resolve(await retryResponse.json());
            } catch (err) {
              reject(err);
            }
          });
        });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `HTTP Error ${response.status}`;
      try {
        const json = JSON.parse(errorText);
        errorMsg = json.error || json.message || errorMsg;
      } catch {
        errorMsg = errorText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    return response.json();
  },

  // Auth: Simple standard signup flow (Name + Email + Password + Confirm Password)
  async signup(params: {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
  }): Promise<{ access_token: string; refresh_token: string; user: User }> {
    const res = await this.request<{
      success: boolean;
      access_token: string;
      refresh_token: string;
      user: User;
    }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    this.setToken(res.access_token);
    if (res.refresh_token) {
      this.setRefreshToken(res.refresh_token);
    }
    return res;
  },

  // Auth: Create Account alias
  async register(params: {
    name: string;
    email: string;
    password: string;
    confirm_password?: string;
    confirmPassword?: string;
    emailOrPhone?: string;
  }): Promise<{ access_token: string; refresh_token: string; user: User }> {
    return this.signup({
      name: params.name,
      email: params.email || params.emailOrPhone || '',
      password: params.password,
      confirm_password: params.confirm_password || params.confirmPassword || '',
    });
  },

  // Auth: Login with Email + Password
  async login(email?: string, password?: string): Promise<{ access_token: string; refresh_token: string; user: User }> {
    const res = await this.request<{ access_token: string; refresh_token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email || 'demo@mindgraph.ai', password: password || 'demo123' }),
    });
    this.setToken(res.access_token);
    if (res.refresh_token) {
      this.setRefreshToken(res.refresh_token);
    }
    return res;
  },

  // Auth: Token Refresh
  async refresh(): Promise<{ access_token: string; refresh_token: string; user: User }> {
    const storedRefreshToken = this.getRefreshToken();
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refresh_token: storedRefreshToken }),
    });

    if (!res.ok) {
      throw new Error('Refresh failed');
    }

    const data = await res.json();
    this.setToken(data.access_token);
    if (data.refresh_token) {
      this.setRefreshToken(data.refresh_token);
    }
    return data;
  },

  // Auth: Request Password Reset Link
  async forgotPassword(email: string): Promise<{ success: boolean; message: string; reset_url?: string; reset_token?: string }> {
    return this.request<{ success: boolean; message: string; reset_url?: string; reset_token?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Auth: Verify Password Reset Link Token
  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    return this.request<{ valid: boolean; email?: string }>('/api/auth/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Auth: Update/Reset Password
  async resetPassword(params: {
    token: string;
    password: string;
    confirm_password: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Auth: Logout
  async logout(): Promise<void> {
    const storedRefreshToken = this.getRefreshToken();
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getToken() || ''}`,
        },
        credentials: 'include',
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      });
    } catch (e) {
      console.warn('Logout endpoint error:', e);
    } finally {
      this.clearToken();
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  },

  // Auth: Current User
  async getMe(): Promise<User> {
    return this.request<User>('/api/auth/me');
  },

  // Health
  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/api/health');
  },

  // Graph
  async getGraph(): Promise<KnowledgeGraphData> {
    return this.request<KnowledgeGraphData>('/api/graph');
  },

  async getConceptState(conceptName: string): Promise<ConceptDetailState> {
    return this.request<ConceptDetailState>(`/api/concepts/${encodeURIComponent(conceptName)}/state`);
  },

  // Intelligence
  async getGaps(target = 'RAG'): Promise<KnowledgeGap> {
    return this.request<KnowledgeGap>(`/api/gaps?target=${encodeURIComponent(target)}`);
  },

  async getBottlenecks(): Promise<BottleneckItem[]> {
    return this.request<BottleneckItem[]>('/api/bottlenecks');
  },

  async getRecommendations(): Promise<RecommendationItem[]> {
    return this.request<RecommendationItem[]>('/api/recommendations');
  },

  async recompute(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/admin/recompute', {
      method: 'POST',
    });
  },

  // Learning Loop
  async generateQuiz(concept: string): Promise<{ concept_name: string; questions: QuizQuestion[] }> {
    return this.request<{ concept_name: string; questions: QuizQuestion[] }>('/api/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({ concept }),
    });
  },

  async generateQuizForDocument(docId: string): Promise<DocumentQuizSet> {
    return this.request<DocumentQuizSet>(`/api/documents/${encodeURIComponent(docId)}/generate-quiz`, {
      method: 'POST',
    });
  },

  async submitQuiz(data: {
    concept_name?: string;
    doc_id?: string;
    answers: { question_id: string; selected_option_index: number; concept_name?: string }[];
    duration_seconds: number;
  }): Promise<MultiConceptQuizResponse> {
    return this.request<MultiConceptQuizResponse>('/api/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async completeRevision(concept_name: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/api/revisions/complete', {
      method: 'POST',
      body: JSON.stringify({ concept_name }),
    });
  },

  async addToRevisionPlan(concept_name: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/planner/add-slot', {
      method: 'POST',
      body: JSON.stringify({ concept_name, duration_minutes: 20, badge: 'REVISION DUE' }),
    });
  },

  async getPlannerToday(): Promise<TodayPlan> {
    return this.request<TodayPlan>('/api/planner/today');
  },

  async getTimeline(): Promise<TimelineEvent[]> {
    return this.request<TimelineEvent[]>('/api/timeline');
  },

  // Grounded Mentor
  async askMentor(question: string): Promise<{
    answer: string;
    evidence: {
      grounded: boolean;
      grounding_score: number;
      concepts_used: any[];
      sources_cited: any[];
      hallucination_check_passed: boolean;
    };
  }> {
    return this.request<{
      answer: string;
      evidence: {
        grounded: boolean;
        grounding_score: number;
        concepts_used: any[];
        sources_cited: any[];
        hallucination_check_passed: boolean;
      };
    }>('/api/mentor/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });
  },

  // Documents
  async processDocument(data: FormData | { text: string }): Promise<DocumentProcessResponse> {
    const token = this.getToken();
    if (data instanceof FormData) {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/documents/process', {
        method: 'POST',
        headers,
        body: data,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Processing failed: ${res.statusText}`);
      }
      return res.json();
    }
    return this.request<DocumentProcessResponse>('/api/documents/process', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateDocumentTitle(docId: string, title: string): Promise<{ success: boolean; document: any }> {
    return this.request<{ success: boolean; document: any }>(`/api/documents/${encodeURIComponent(docId)}/title`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
  },

  async uploadDocument(formData: FormData): Promise<DocumentUploadResponse> {
    const token = this.getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
    return res.json();
  },

  // Dashboard & Evaluation
  async getDashboard(): Promise<DashboardData> {
    return this.request<DashboardData>('/api/dashboard');
  },

  async getEvaluation(): Promise<EvaluationData> {
    return this.request<EvaluationData>('/api/evaluation');
  },

  // ==========================================
  // AI TOOLS SUITE
  // ==========================================
  async explainConcept(params: {
    concept: string;
    mode?: 'analogy' | 'first-principles' | 'eli5' | 'engineering';
    depth?: 'quick' | 'deep';
  }): Promise<import('../types').ConceptExplainerResult> {
    return this.request<import('../types').ConceptExplainerResult>('/api/ai-tools/explain', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async generateFlashcards(params: {
    concept: string;
    count?: number;
  }): Promise<import('../types').FlashcardDeck> {
    return this.request<import('../types').FlashcardDeck>('/api/ai-tools/flashcards', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async evaluateSocratic(params: {
    concept: string;
    userExplanation: string;
    history?: any[];
  }): Promise<import('../types').SocraticFeedback> {
    return this.request<import('../types').SocraticFeedback>('/api/ai-tools/socratic', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async synthesizeConcepts(params: {
    conceptA: string;
    conceptB: string;
  }): Promise<import('../types').ConceptSynthesis> {
    return this.request<import('../types').ConceptSynthesis>('/api/ai-tools/synthesize', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async decodeFormula(params: {
    formulaName?: string;
    customLatex?: string;
  }): Promise<import('../types').FormulaDecoderResult> {
    return this.request<import('../types').FormulaDecoderResult>('/api/ai-tools/formula-decoder', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async generateCodeSnippet(params: {
    concept: string;
    framework?: 'pytorch' | 'numpy' | 'python';
    complexity?: 'minimal' | 'annotated' | 'production';
  }): Promise<import('../types').CodeGenerationResult> {
    return this.request<import('../types').CodeGenerationResult>('/api/ai-tools/code-generator', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async logCardReview(params: {
    cardId: string;
    concept: string;
    rating: 1 | 2 | 3 | 4;
  }): Promise<{ success: boolean; concept: string; newStability: number; newConfidence: number; message: string }> {
    return this.request<{ success: boolean; concept: string; newStability: number; newConfidence: number; message: string }>(
      '/api/ai-tools/log-card-review',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  },

  async updateThemePreference(theme: 'light' | 'dark'): Promise<{ success: boolean; theme: string }> {
    return this.request<{ success: boolean; theme: string }>('/api/auth/theme', {
      method: 'PUT',
      body: JSON.stringify({ theme }),
    });
  },
};

