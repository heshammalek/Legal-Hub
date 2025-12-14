export interface User {
  id: string;
  name: string;
  role: string;
  specialization?: string;
  reputation_score: number;
  badge?: string;
  avatar_url?: string;
}

export interface QuestionStats {
  views_count: number;
  answers_count: number;
  upvotes_count: number;
  followers_count: number;
  engagement_score: number;
  shares_count: number;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  created_at: string;
}

export interface Answer {
  id: string;
  content: string;
  summary?: string;
  author: User;
  is_accepted: boolean;
  is_expert_verified: boolean;
  upvotes_count: number;
  downvotes_count: number;
  helpful_score: number;
  clarity_rating: number;
  accuracy_rating: number;
  completeness_rating: number;
  created_at: string;
  updated_at: string;
  user_vote?: "upvote" | "downvote" | "helpful" | null;
  can_edit: boolean;
  can_accept: boolean;
  comments: Comment[];
  attachments: string[];
  legal_references: string[];
}

export interface Question {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: User;
  stats: QuestionStats;
  status: "open" | "closed" | "resolved";
  is_anonymous: boolean;
  is_urgent: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  accepted_answer?: Answer;
  answers: Answer[];
  is_following: boolean;
  user_vote?: string;
  can_edit: boolean;
  can_close: boolean;
  featured_until?: string;
}

export interface QuestionListResponse {
  questions: Question[];
  total_count: number;
  page: number;
  total_pages: number;
  categories: { [key: string]: number };
}

export interface CreateQuestionData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_anonymous: boolean;
  is_urgent: boolean;
}

export interface CreateAnswerData {
  question_id: string;
  content: string;
  summary?: string;
  attachments?: string[];
  legal_references?: string[];
}

export interface VoteRequest {
  vote_type: "upvote" | "downvote" | "helpful";
}

export interface DiscussionStats {
  total_questions: number;
  total_answers: number;
  total_users: number;
  resolved_questions: number;
  trending_categories: { [key: string]: number };
  active_users: string[];
}