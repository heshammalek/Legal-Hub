

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { discussionAPI } from "@/services/discussionApi";
import {
  Question,
  QuestionListResponse,
  CreateQuestionData,
  CreateAnswerData
} from "@/types/discussion";
import {
  Search, Filter, TrendingUp, Users, MessageSquare, Clock,
  CheckCircle, Star, Plus, ThumbsUp, ThumbsDown, Bookmark,
  Share, MoreVertical, Eye, MessageCircle, Zap,
  Loader, AlertCircle, FileText, Award, X, Send,
  ChevronDown, ChevronUp, Heart, Flag
} from "lucide-react";


// ============================================
// المكونات المساعدة
// ============================================

const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <Loader className="h-8 w-8 animate-spin text-blue-600" />
    <span className="mr-2 text-gray-600">جاري التحميل...</span>
  </div>
);

const ErrorMessage = ({ error, onRetry }: { error: any; onRetry: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
    <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-red-800 mb-2">حدث خطأ</h3>
    <p className="text-red-600 mb-4">{error.message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
    >
      إعادة المحاولة
    </button>
  </div>
);

const EmptyState = ({ 
  searchQuery, 
  selectedCategory, 
  onAskQuestion 
}: { 
  searchQuery: string; 
  selectedCategory: string;
  onAskQuestion: () => void;
}) => (
  <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد أسئلة</h3>
    <p className="text-gray-600 mb-6">
      {searchQuery 
        ? `لم يتم العثور على أسئلة تطابق "${searchQuery}"`
        : selectedCategory !== 'all'
        ? `لا توجد أسئلة في تصنيف "${selectedCategory}"`
        : "كن أول من يطرح سؤالاً في المجتمع القانوني"
      }
    </p>
    {!searchQuery && (
      <button 
        type="button"
        onClick={onAskQuestion}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        اطرح أول سؤال
      </button>
    )}
  </div>
);

// ============================================
// مكونات البطاقات
// ============================================

const AnswerCard = ({ 
  answer, 
  onVote 
}: { 
  answer: any; 
  onVote: (answerId: string, voteType: string) => void;
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case "خبير": return "bg-gradient-to-r from-purple-500 to-purple-600 text-white";
      case "متميز": return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case "نشط": return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "الآن";
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 border">
      <div className="flex gap-4">
        {/* تصويت الإجابة */}
        <div className="flex flex-col items-center gap-2">
          <button 
            type="button"
            onClick={() => onVote(answer.id, "upvote")}
            className={`p-1 rounded transition-colors ${
              answer.user_vote === "upvote" ? "text-green-600 bg-green-50" : "text-gray-600 hover:text-green-600 hover:bg-gray-100"
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-gray-900">
            {answer.upvotes_count - answer.downvotes_count}
          </span>
          <button 
            type="button"
            onClick={() => onVote(answer.id, "downvote")}
            className={`p-1 rounded transition-colors ${
              answer.user_vote === "downvote" ? "text-red-600 bg-red-50" : "text-gray-600 hover:text-red-600 hover:bg-gray-100"
            }`}
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
          
          {answer.is_accepted && (
            <CheckCircle className="h-5 w-5 text-green-600 mt-2" />
          )}
        </div>

        {/* محتوى الإجابة */}
        <div className="flex-1">
          {/* معلومات الكاتب */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-xs">
              {answer.author.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <span className="font-medium text-sm text-gray-900">{answer.author.name}</span>
            {answer.author.badge && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(answer.author.badge)}`}>
                {answer.author.badge}
              </span>
            )}
            {answer.is_expert_verified && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ موثوق
              </span>
            )}
            <span className="text-gray-500 text-sm">•</span>
            <span className="text-gray-500 text-sm">{formatTime(answer.created_at)}</span>
          </div>

          {/* محتوى الإجابة */}
          <p className="text-gray-700 leading-relaxed mb-3">{answer.content}</p>

          {answer.summary && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-blue-800 text-sm">{answer.summary}</p>
            </div>
          )}

          {/* المراجع القانونية */}
          {answer.legal_references && answer.legal_references.length > 0 && (
            <div className="mb-3">
              <h5 className="font-medium text-gray-900 text-sm mb-2">المراجع القانونية:</h5>
              <div className="flex flex-wrap gap-1">
                {answer.legal_references.map((ref: string, index: number) => (
                  <span key={index} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {ref}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* إجراءات الإجابة */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <button 
              type="button"
              onClick={() => onVote(answer.id, "helpful")}
              className={`flex items-center gap-1 hover:text-green-600 transition-colors ${
                answer.user_vote === "helpful" ? "text-green-600" : ""
              }`}
            >
              <Heart className="h-3 w-3" />
              مفيد ({answer.helpful_score})
            </button>
            <button 
              type="button"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1 hover:text-blue-600 transition-colors"
            >
              <MessageCircle className="h-3 w-3" />
              تعليق ({answer.comments?.length || 0})
            </button>
            <button  
              type="button"
              className="flex items-center gap-1 hover:text-red-600 transition-colors"
            >
              <Flag className="h-3 w-3" />
              تبليغ
            </button>
          </div>

          {/* التعليقات */}
          {showComments && (
            <div className="mt-4 border-t pt-4">
              <div className="space-y-3 mb-3">
                {answer.comments?.map((comment: any) => (
                  <div key={comment.id} className="flex gap-2">
                    <div className="w-5 h-5 bg-gray-300 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-xs text-gray-900">{comment.author.name}</span>
                        <span className="text-gray-500 text-xs">{formatTime(comment.created_at)}</span>
                      </div>
                      <p className="text-gray-700 text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="أضف تعليقاً..."
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <button 
                  type="button"
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Send className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QuestionCard = ({ 
  question, 
  isExpanded, 
  onToggle,
  onFollow,
  onAnswer,
  onVote 
}: { 
  question: Question;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onFollow: (id: string) => void;
  onAnswer: (questionId: string, content: string) => void;
  onVote: (answerId: string, voteType: string) => void;
}) => {
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answerContent, setAnswerContent] = useState("");

  const handleSubmitAnswer = () => {
    if (answerContent.trim().length < 10) {
      alert("الإجابة يجب أن تحتوي على الأقل 10 أحرف");
      return;
    }
    onAnswer(question.id, answerContent);
    setAnswerContent("");
    setShowAnswerForm(false);
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case "خبير": return "bg-gradient-to-r from-purple-500 to-purple-600 text-white";
      case "متميز": return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
      case "نشط": return "bg-gradient-to-r from-green-500 to-green-600 text-white";
      case "مبتدئ": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "الآن";
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${Math.floor(hours / 24)} يوم`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-300 mb-4">
      <div className="p-6">
        <div className="flex gap-4">
          {/* الإحصائيات الجانبية */}
          <div className="flex flex-col items-center gap-3 w-16 flex-shrink-0">
            <button 
              type="button"
              className="flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ThumbsUp className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-semibold text-gray-900 mt-1">
                {question.stats.upvotes_count}
              </span>
            </button>
            
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              question.status === "open" 
                ? "bg-green-100 text-green-800 border border-green-200" 
                : "bg-blue-100 text-blue-800 border border-blue-200"
            }`}>
              {question.status === "open" ? "مفتوح" : "محلول"}
            </div>
            
            <div className="flex flex-col items-center text-center">
              <MessageCircle className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-semibold text-gray-900 mt-1">
                {question.stats.answers_count}
              </span>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <Eye className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-semibold text-gray-900 mt-1">
                {question.stats.views_count}
              </span>
            </div>
          </div>

          {/* محتوى السؤال */}
          <div className="flex-1 min-w-0">
            {/* العنوان والعلامات */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 
                  className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer mb-3 line-clamp-2 transition-colors"
                  onClick={() => onToggle(question.id)}
                >
                  {question.title}
                  {question.is_urgent && (
                    <span className="mr-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                      <Zap className="h-3 w-3 ml-1" />
                      عاجل
                    </span>
                  )}
                  {question.is_featured && (
                    <span className="mr-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                      <Star className="h-3 w-3 ml-1" />
                      مميز
                    </span>
                  )}
                </h3>
                
                <p className="text-gray-600 leading-relaxed mb-4">
                  {isExpanded 
                    ? question.content 
                    : `${question.content.substring(0, 200)}${question.content.length > 200 ? '...' : ''}`
                  }
                </p>
                
                {question.content.length > 200 && (
                  <button
                    type="button"
                    onClick={() => onToggle(question.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 transition-colors"
                  >
                    {isExpanded ? "عرض أقل" : "عرض المزيد"}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* الوسوم */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {question.category}
              </span>
              {question.tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  #{tag}
                </span>
              ))}
            </div>

            {/* معلومات الناشر والوقت */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {question.author.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 block">
                      {question.is_anonymous ? "مجهول" : question.author.name}
                    </span>
                    {!question.is_anonymous && question.author.badge && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(question.author.badge)}`}>
                        {question.author.badge}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-gray-500">•</span>
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  {formatTime(question.last_activity_at)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => onFollow(question.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    question.is_following 
                      ? "bg-blue-100 text-blue-600" 
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <Bookmark className="h-4 w-4" />
                </button>
                <button 
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                >
                  <Share className="h-4 w-4" />
                </button>
                <button 
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                >
                  <Flag className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex gap-3 mt-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowAnswerForm(!showAnswerForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                أضف إجابة
              </button>
              <button
                type="button"
                onClick={() => onToggle(question.id)}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                {isExpanded ? "إخفاء الإجابات" : `عرض الإجابات (${question.answers.length})`}
              </button>
            </div>

            {/* نموذج الإجابة */}
            {showAnswerForm && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <textarea
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  placeholder="اكتب إجابتك هنا... (至少 10 أحرف)"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical transition-colors"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={answerContent.trim().length < 10}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                  >
                    نشر الإجابة
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAnswerForm(false)}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            {/* عرض الإجابات */}
            {isExpanded && question.answers.length > 0 && (
              <div className="mt-6 border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  الإجابات ({question.answers.length})
                </h4>
                <div className="space-y-4">
                  {question.answers.map((answer) => (
                    <AnswerCard 
                      key={answer.id} 
                      answer={answer} 
                      onVote={onVote}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// مكون الفلاتر والإحصائيات
// ============================================

const FiltersSection = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  showAdvancedFilters,
  onAdvancedFiltersToggle
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  showAdvancedFilters: boolean;
  onAdvancedFiltersToggle: () => void;
}) => {
  const categories = [
    { value: "all", label: "جميع التصنيفات", icon: "📚" },
    { value: "قانون مدني", label: "قانون مدني", icon: "⚖️" },
    { value: "قانون جنائي", label: "قانون جنائي", icon: "🔒" },
    { value: "قانون تجاري", label: "قانون تجاري", icon: "💼" },
    { value: "قانون إداري", label: "قانون إداري", icon: "🏛️" },
    { value: "قانون عمل", label: "قانون عمل", icon: "👨‍💼" },
    { value: "قانون أسرة", label: "قانون أسرة", icon: "👨‍👩‍👧‍👦" },
    { value: "قانون دولي", label: "قانون دولي", icon: "🌍" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* شريط البحث */}
        <div className="flex-1 relative w-full">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="ابحث في الأسئلة والإجابات..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-colors"
          />
        </div>
        
        {/* الفلاتر الأساسية */}
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[180px] transition-colors"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.icon} {category.label}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[150px] transition-colors"
          >
            <option value="newest">🆕 الأحدث</option>
            <option value="popular">🔥 الأكثر تفاعلاً</option>
            <option value="unanswered">❓ بدون إجابات</option>
            <option value="trending">🚀 الرائجة</option>
          </select>

          <button
            type="button"
            onClick={onAdvancedFiltersToggle}
            className="px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <Filter className="h-4 w-4" />
            فلاتر متقدمة
          </button>
        </div>
      </div>

      {/* الفلاتر المتقدمة */}
      {showAdvancedFilters && (
        <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحالة
            </label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
              <option value="">جميع الحالات</option>
              <option value="open">مفتوحة</option>
              <option value="closed">مغلقة</option>
              <option value="resolved">محلولة</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              بها إجابة مقبولة
            </label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
              <option value="">الكل</option>
              <option value="true">نعم</option>
              <option value="false">لا</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الفترة الزمنية
            </label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
              <option value="">أي وقت</option>
              <option value="today">اليوم</option>
              <option value="week">أسبوع</option>
              <option value="month">شهر</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع المستخدم
            </label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
              <option value="">الكل</option>
              <option value="lawyer">محامي</option>
              <option value="judge">قاضي</option>
              <option value="expert">خبير</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

const StatsSection = ({ stats }: { stats: any }) => {
  const defaultStats = [
    { icon: MessageSquare, label: "سؤال نشط", value: stats?.total_questions || "0", color: "blue" },
    { icon: Users, label: "إجابة اليوم", value: stats?.total_answers || "0", color: "green" },
    { icon: CheckCircle, label: "أسئلة محلولة", value: stats?.resolved_questions || "0", color: "purple" },
    { icon: TrendingUp, label: "تفاعل اليوم", value: stats?.active_questions || "0", color: "orange" }
  ];

  const getColorClass = (color: string) => {
    const colors: any = {
      blue: { bg: "bg-blue-100", text: "text-blue-600" },
      green: { bg: "bg-green-100", text: "text-green-600" },
      purple: { bg: "bg-purple-100", text: "text-purple-600" },
      orange: { bg: "bg-orange-100", text: "text-orange-600" }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {defaultStats.map((stat, index) => {
        const colorClass = getColorClass(stat.color);
        return (
          <div key={index} className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${colorClass.bg}`}>
                <stat.icon className={`h-6 w-6 ${colorClass.text}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// عرض الأسئلة
// ============================================

const QuestionsView = ({
  questions,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  showAdvancedFilters,
  onAdvancedFiltersToggle,
  expandedQuestion,
  onQuestionToggle,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onCreateAnswer,
  onFollowQuestion,
  onVoteAnswer,
  onAskQuestion
}: any) => {
  const queryClient = useQueryClient();
const followMutation = useMutation({
  mutationFn: discussionAPI.followQuestion,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['questions'] }); // ✅ يشتغل مع كل الفلاتر
  }
});

const voteMutation = useMutation({
  mutationFn: ({ answerId, voteType }: { answerId: string; voteType: string }) => 
    discussionAPI.voteAnswer(answerId, voteType),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['questions'] }); // ✅ يشتغل مع كل الفلاتر
  }
});

  const handleFollow = useCallback((questionId: string) => {
    followMutation.mutate(questionId);
  }, [followMutation]);

  const handleVote = useCallback((answerId: string, voteType: string) => {
    voteMutation.mutate({ answerId, voteType });
  }, [voteMutation]);

  const handleAnswer = useCallback((questionId: string, content: string) => {
    onCreateAnswer({
      question_id: questionId,
      content: content
    });
  }, [onCreateAnswer]);

  return (
    <div className="space-y-6">
      {/* الفلاتر */}
      <FiltersSection
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
        showAdvancedFilters={showAdvancedFilters}
        onAdvancedFiltersToggle={onAdvancedFiltersToggle}
      />

      {/* قائمة الأسئلة */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <EmptyState 
            searchQuery={searchQuery} 
            selectedCategory={selectedCategory} 
            onAskQuestion={onAskQuestion}
          />
        ) : (
          <>
            {questions.map((question: Question, index: number) => (
              <QuestionCard
                key={`${question.id}-${index}`}
                question={question}
                isExpanded={expandedQuestion === question.id}
                onToggle={onQuestionToggle}
                onFollow={handleFollow}
                onAnswer={handleAnswer}
                onVote={handleVote}
              />
            ))}
            
            {/* زر تحميل المزيد */}
            {hasNextPage && (
              <div className="flex justify-center mt-8">
                <button
                  type="button"
                  onClick={() => onLoadMore()}
                  disabled={isFetchingNextPage}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {isFetchingNextPage ? (
                    <span className="flex items-center gap-2">
                      <Loader className="h-4 w-4 animate-spin" />
                      جاري التحميل...
                    </span>
                  ) : (
                    "تحميل المزيد من الأسئلة"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ============================================
// عرض طرح السؤال
// ============================================

const AskQuestionView = ({ onSubmit, isLoading, onCancel }: any) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "قانون مدني",
    tags: [] as string[],
    is_anonymous: false,
    is_urgent: false
  });
  const [tagInput, setTagInput] = useState("");
  const [formErrors, setFormErrors] = useState<{title?: string; content?: string}>({});

  // تحقق من الصحة بشكل صحيح
  const isFormValid = useMemo(() => {
    const titleValid = formData.title.trim().length >= 10 && formData.title.trim().length <= 200;
    const contentValid = formData.content.trim().length >= 20;
    
    return titleValid && contentValid;
  }, [formData.title, formData.content]);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  }, [tagInput, formData.tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      // عرض أخطاء محددة
      const errors: {title?: string; content?: string} = {};
      
      if (formData.title.trim().length < 10) {
        errors.title = "عنوان السؤال يجب أن يكون 10 أحرف";
      } else if (formData.title.trim().length > 200) {
        errors.title = "عنوان السؤال يجب ألا يتجاوز 200 حرف";
      }
      
      if (formData.content.trim().length < 20) {
        errors.content = "محتوى السؤال يجب أن يكون 20 حرف";
      }
      
      setFormErrors(errors);
      return;
    }
    
    // تنظيف البيانات قبل الإرسال
    const submitData = {
      title: formData.title.trim(),
      content: formData.content.trim(),
      category: formData.category,
      tags: formData.tags,
      is_anonymous: formData.is_anonymous,
      is_urgent: formData.is_urgent
    };
    
    console.log("📤 إرسال بيانات السؤال:", submitData);
    onSubmit(submitData);
  }, [formData, isFormValid, onSubmit]);

  // إعادة تعيين الأخطاء عند تغيير الحقول
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, title: e.target.value }));
    if (formErrors.title) {
      setFormErrors(prev => ({ ...prev, title: undefined }));
    }
  }, [formErrors.title]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, content: e.target.value }));
    if (formErrors.content) {
      setFormErrors(prev => ({ ...prev, content: undefined }));
    }
  }, [formErrors.content]);

  const categories = [
    { value: "قانون مدني", label: "قانون مدني", icon: "⚖️" },
    { value: "قانون جنائي", label: "قانون جنائي", icon: "🔒" },
    { value: "قانون تجاري", label: "قانون تجاري", icon: "💼" },
    { value: "قانون إداري", label: "قانون إداري", icon: "🏛️" },
    { value: "قانون عمل", label: "قانون عمل", icon: "👨‍💼" },
    { value: "قانون أسرة", label: "قانون أسرة", icon: "👨‍👩‍👧‍👦" },
    { value: "قانون دولي", label: "قانون دولي", icon: "🌍" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">اطرح سؤالاً جديداً</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* عنوان السؤال */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              عنوان السؤال *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={handleTitleChange}
              placeholder="اكتب عنواناً واضحاً ومختصراً لسؤالك لايقل عن 10 احرف..."
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                formErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              required
            />
            <div className="flex justify-between mt-1">
              <p className={`text-xs ${formData.title.length > 200 ? 'text-red-600' : 'text-gray-500'}`}>
                {formData.title.length}/200 حرف ( 10 أحرف)
              </p>
              {formErrors.title && (
                <p className="text-xs text-red-600">{formErrors.title}</p>
              )}
            </div>
          </div>

          {/* وصف السؤال */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              وصف السؤال *
            </label>
            <textarea
              value={formData.content}
              onChange={handleContentChange}
              placeholder="صف سؤالك - لايقل عن 20 حرف -  بالتفصيل وأضيف أي معلومات قد تساعد في فهم السياق القانوني..."
              rows={8}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical transition-colors ${
                formErrors.content ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              required
            />
            <div className="flex justify-between mt-1">
              <p className={`text-xs ${formData.content.length < 20 ? 'text-red-600' : 'text-gray-500'}`}>
                {formData.content.length} حرف ( 20 حرف)
              </p>
              {formErrors.content && (
                <p className="text-xs text-red-600">{formErrors.content}</p>
              )}
            </div>
          </div>

          {/* التصنيف والوسوم */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التصنيف *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوسوم
              </label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="أضف وسوماً ثم اضغط Enter..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="bg-gray-600 text-white px-4 py-3 rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  إضافة
                </button>
              </div>
              
              {/* الوسوم المضافة */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* الخيارات */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_anonymous}
                onChange={(e) => setFormData(prev => ({...prev, is_anonymous: e.target.checked}))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-colors"
              />
              <span className="text-sm text-gray-700">نشر بشكل مجهول</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_urgent}
                onChange={(e) => setFormData(prev => ({...prev, is_urgent: e.target.checked}))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-colors"
              />
              <span className="text-sm text-gray-700">سؤال عاجل</span>
            </label>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-4 pt-6 border-t">
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
              {isLoading ? "جاري النشر..." : "نشر السؤال"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// المكون الرئيسي
// ============================================

export default function AskPeersTab() {
  const [activeTab, setActiveTab] = useState<"questions" | "ask">("questions");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const queryClient = useQueryClient();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // جلب الإحصائيات
  const { data: statsData } = useQuery({
    queryKey: ['discussion-stats'],
    queryFn: async () => {
      const response = await fetch('/api/v1/discussions/stats');
      if (!response.ok) throw new Error('فشل في جلب الإحصائيات');
      return response.json();
    }
  });

  // إصلاح useInfiniteQuery
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['questions', debouncedSearchQuery, selectedCategory, sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      const filters: any = {
        skip: pageParam * 20,
        limit: 20
      };
      
      if (debouncedSearchQuery) filters.search = debouncedSearchQuery;
      if (selectedCategory !== 'all') filters.category = selectedCategory;
      if (sortBy) filters.sort_by = sortBy;
      
      console.log("📥 جلب الأسئلة:", { pageParam, filters });
      return await discussionAPI.getQuestions(filters, pageParam);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: QuestionListResponse, allPages: QuestionListResponse[]) => {
      const nextPage = allPages.length;
      const hasMore = lastPage.questions && lastPage.questions.length === 20;
      console.log("📊 حساب الصفحة التالية:", { nextPage, hasMore, total: lastPage.total_count });
      return hasMore ? nextPage : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

  // طفرات البيانات
  const createQuestionMutation = useMutation({
    mutationFn: (data: CreateQuestionData) => discussionAPI.createQuestion(data),
    onSuccess: (data) => {
      console.log("✅ تم إنشاء السؤال بنجاح:", data);
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['discussion-stats'] });
      setActiveTab("questions");
      alert("تم نشر سؤالك بنجاح!");
    },
    onError: (error: any) => {
      console.error("❌ فشل في إنشاء السؤال:", error);
      alert(`فشل في نشر السؤال: ${error.message}`);
    }
  });

  const createAnswerMutation = useMutation({
    mutationFn: (data: CreateAnswerData) => discussionAPI.createAnswer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['discussion-stats'] });
      alert("تم نشر إجابتك بنجاح!");
    },
    onError: (error: any) => {
      console.error("❌ فشل في إضافة الإجابة:", error);
      alert(`فشل في نشر الإجابة: ${error.message}`);
    }
  });

  const followQuestionMutation = useMutation({
    mutationFn: (questionId: string) => discussionAPI.followQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
    onError: (error: any) => {
      console.error("❌ فشل في متابعة السؤال:", error);
    }
  });

  const voteAnswerMutation = useMutation({
    mutationFn: ({ answerId, voteType }: { answerId: string; voteType: string }) => 
      discussionAPI.voteAnswer(answerId, voteType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    },
    onError: (error: any) => {
      console.error("❌ فشل في التصويت:", error);
    }
  });

  // جميع الأسئلة
  const allQuestions = useMemo(() => {
    return data?.pages.flatMap(page => page.questions || []) || [];
  }, [data]);

  // دالة لفتح نموذج السؤال
  const handleAskQuestion = useCallback(() => {
    console.log("🔄 فتح نموذج طرح سؤال جديد");
    setActiveTab("ask");
  }, []);

  // معالجة تبديل السؤال
  const handleQuestionToggle = useCallback((questionId: string) => {
    setExpandedQuestion(prev => prev === questionId ? null : questionId);
  }, []);

  // معالجة الأخطاء والتحميل
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage error={error} onRetry={refetch} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* الهيدر */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">المناقشات القانونية</h1>
              <p className="text-gray-600 mt-2">شارك خبرتك واستفد من تجارب الآخرين</p>
            </div>
            <button
              type="button"
              onClick={handleAskQuestion}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg flex items-center gap-2 font-semibold"
            >
              <Plus className="h-5 w-5" />
              طرح سؤال جديد
            </button>
          </div>

          {/* التبويبات */}
          <div className="flex space-x-8 rtl:space-x-reverse border-b">
            <button
              type="button"
              onClick={() => setActiveTab("questions")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "questions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              جميع الأسئلة ({allQuestions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ask")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "ask"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              طرح سؤال
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "questions" ? (
          <QuestionsView
            questions={allQuestions}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
            showAdvancedFilters={showAdvancedFilters}
            onAdvancedFiltersToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
            expandedQuestion={expandedQuestion}
            onQuestionToggle={handleQuestionToggle}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
            onCreateAnswer={createAnswerMutation.mutate}
            onFollowQuestion={followQuestionMutation.mutate}
            onVoteAnswer={voteAnswerMutation.mutate}
            onAskQuestion={handleAskQuestion}
          />
        ) : (
          <AskQuestionView
            onSubmit={createQuestionMutation.mutate}
            isLoading={createQuestionMutation.isPending}
            onCancel={() => setActiveTab("questions")}
          />
        )}
      </div>
    </div>
  );
}