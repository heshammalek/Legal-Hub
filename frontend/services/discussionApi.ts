

import { 
  QuestionListResponse, 
  CreateQuestionData, 
  CreateAnswerData,
  VoteRequest 
} from '@/types/discussion';





class DiscussionAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'DiscussionAPIError';
  }
}



export const discussionAPI = {
  getQuestions: async (filters: any, pageParam: number = 0): Promise<QuestionListResponse> => {
    try {
      const params = new URLSearchParams({
        skip: (pageParam * 20).toString(),
        limit: "20",
        ...filters
      });
      
      // إزالة القيم الفارغة
      Array.from(params.entries()).forEach(([key, value]) => {
        if (!value || value === "all" || value === "") params.delete(key);
      });
      
      const response = await fetch(`/api/v1/discussions/questions?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new DiscussionAPIError(
          errorData.detail || `خطأ في الخادم: ${response.status}`, 
          response.status
        );
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ فشل في جلب الأسئلة:', error);
      throw error;
    }
  },

  createQuestion: async (questionData: CreateQuestionData) => {
    try {
      const response = await fetch('/api/v1/discussions/questions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new DiscussionAPIError(
          errorData.detail || `خطأ في الخادم: ${response.status}`,
          response.status
        );
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ فشل في إنشاء السؤال:', error);
      throw error;
    }
  },

 createAnswer: async (answerData: CreateAnswerData) => {
  try {
    // ✅ أبسط بيانات ممكنة
    const requestData = {
      question_id: answerData.question_id,
      content: answerData.content,
      summary: answerData.summary || null
    };

    console.log('📤 إرسال بيانات الإجابة المبسطة:', requestData);

    const response = await fetch('/api/v1/discussions/answers', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new DiscussionAPIError(
        errorData.detail || `خطأ في الخادم: ${response.status}`,
        response.status
      );
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ فشل في إنشاء الإجابة:', error);
    throw error;
  }
},

  followQuestion: async (questionId: string) => {
    try {
      const response = await fetch(`/api/v1/discussions/questions/${questionId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new DiscussionAPIError(
          errorData.detail || `خطأ في الخادم: ${response.status}`,
          response.status
        );
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ فشل في متابعة السؤال:', error);
      throw error;
    }
  },

  voteAnswer: async (answerId: string, voteType: string) => {
    try {
      const response = await fetch(`/api/v1/discussions/answers/${answerId}/vote`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote_type: voteType })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new DiscussionAPIError(
          errorData.detail || `خطأ في الخادم: ${response.status}`,
          response.status
        );
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ فشل في التصويت:', error);
      throw error;
    }
  }
};


