// src/lib/ragService.ts
interface LegalDocument {
  id: string
  title: string
  content: string
  type: 'law' | 'case' | 'doctrine' | 'principle'
  domain: string
  source: string
  relevance_score?: number
}

interface RAGResponse {
  answer: string
  sources: LegalDocument[]
  confidence: number
  suggested_questions: string[]
}

interface SearchFilters {
  domain?: string
  type?: string
  year?: number
  jurisdiction?: string
}

class RAGService {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';
    this.token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`RAG Service Error: ${response.statusText}`);
    }

    return response.json();
  }

  // البحث في القوانين والتشريعات
  async searchLaws(query: string, filters: SearchFilters = {}): Promise<LegalDocument[]> {
    try {
      // محاكاة مؤقتة - سيتم استبدالها بالخدمة الحقيقية
      const mockLaws: LegalDocument[] = [
        {
          id: '1',
          title: 'نظام الإجراءات الجزائية',
          content: 'المادة 1: تسري أحكام هذا النظام على كل جريمة تقع في أراضي المملكة...',
          type: 'law',
          domain: 'جنائي',
          source: 'النظام الأساسي للحكم',
          relevance_score: 0.95
        },
        {
          id: '2',
          title: 'قضية تعويض عن ضرر مادي',
          content: 'في قضية رقم ١٠٢٥/م، قضت المحكمة بالتعويض عن الأضرار المادية الناتجة عن الإهمال...',
          type: 'case',
          domain: 'مدني',
          source: 'سجلات المحكمة العليا',
          relevance_score: 0.87
        }
      ];

      return mockLaws.filter(doc => 
        doc.content.includes(query) || 
        doc.title.includes(query)
      );
    } catch (error) {
      console.error('Error searching laws:', error);
      return [];
    }
  }

  // الحصول على إجابة من نظام RAG
  async getAnswer(question: string, context: string = ''): Promise<RAGResponse> {
    try {
      // محاكاة مؤقتة - سيتم استبدالها بالخدمة الحقيقية
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockResponse: RAGResponse = {
        answer: `بناءً على البحث في التشريعات والقوانين ذات الصلة:

${question} يتم تنظيمه وفقًا لنظام الإجراءات الجزائية الذي ينص على أن المحاكمة يجب أن تكون علنية إلا في حالات محددة. كما أن نظام المرافعات الشرعية يؤكد على حق المتهم في الدفاع.

الاستثناءات تشمل القضايا التي تتعلق بالأمن الوطني أو الآداب العامة، حيث يجوز للمحكمة أن تقرر إجراء الجلسات بشكل سري.`,
        sources: [
          {
            id: '1',
            title: 'نظام الإجراءات الجزائية',
            content: 'المادة 68: جلسات المحاكمة علنية إلا إذا قررت المحكمة سريتها...',
            type: 'law',
            domain: 'جنائي',
            source: 'المركز الوطني للوثائق'
          },
          {
            id: '2', 
            title: 'قضية سريان الجلسات',
            content: 'القضية رقم ٤٥٣/ج - حكمت المحكمة بسريان الجلسات لحماية الشهود...',
            type: 'case',
            domain: 'جنائي',
            source: 'سجلات المحكمة العليا'
          }
        ],
        confidence: 0.88,
        suggested_questions: [
          'ما هي شروط سرية جلسات المحكمة؟',
          'ما حقوق المتهم في الجلسات السرية؟',
          'كيف يتم الطلب بإجراء جلسات سرية؟'
        ]
      };

      return mockResponse;
    } catch (error) {
      console.error('Error getting RAG answer:', error);
      throw error;
    }
  }

  // تقييم الإجابة باستخدام RAG
  async evaluateAnswer(studentAnswer: string, correctAnswer: string, domain: string): Promise<any> {
    try {
      // محاكاة مؤقتة للتقييم
      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        score: 85,
        legal_accuracy: 90,
        completeness: 80,
        clarity: 75,
        feedback: 'الإجابة تُظهر فهمًا جيدًا للمفاهيم الأساسية مع بعض النقاط التي تحتاج إلى تحسين',
        suggestions: [
          'الربط بين النص القانوني والتطبيق العملي',
          'إضافة أمثلة من السوابق القضائية',
          'توضيح العلاقة بين التشريعات المختلفة'
        ],
        missing_points: [
          'الاستشهاد بالمادة القانونية الدقيقة',
          'ذكر الاستثناءات الواردة في النظام'
        ]
      };
    } catch (error) {
      console.error('Error evaluating answer:', error);
      throw error;
    }
  }

  // توليد أسئلة بناءً على المحتوى
  async generateQuestions(content: string, count: number = 5, difficulty: string = 'medium'): Promise<string[]> {
    try {
      // محاكاة مؤقتة
      await new Promise(resolve => setTimeout(resolve, 1000));

      return [
        'ما هي الشروط الواجب توافرها في الدعوى القضائية؟',
        'كيف يتم تقديم الأدلة في القضايا المدنية؟',
        'ما الفرق بين المسؤولية التقصيرية والعقدية؟',
        'كيف يتم حساب التعويض في حالة الضرر المادي؟',
        'ما هي مدة التقادم في الدعاوى المدنية؟'
      ];
    } catch (error) {
      console.error('Error generating questions:', error);
      return [];
    }
  }

  // البحث في السوابق القضائية
  async searchCaseLaw(query: string, domain: string): Promise<LegalDocument[]> {
    try {
      const mockCaseLaw: LegalDocument[] = [
        {
          id: 'case-1',
          title: 'قضية التعويض عن الخطأ الطبي',
          content: 'قضت المحكمة بالتعويض عن الضرر المعنوي والمادي الناتج عن الخطأ الطبي...',
          type: 'case',
          domain: 'مدني',
          source: 'المحكمة العليا - 2023',
          relevance_score: 0.92
        },
        {
          id: 'case-2',
          title: 'قضية المسؤولية عن المنتجات',
          content: 'حكمت المحكمة بمسؤولية المصنع عن الأضرار الناتجة عن عيوب المنتج...',
          type: 'case',
          domain: 'تجاري', 
          source: 'محكمة الاستئناف - 2022',
          relevance_score: 0.85
        }
      ];

      return mockCaseLaw.filter(caseLaw => 
        caseLaw.content.includes(query) && 
        caseLaw.domain === domain
      );
    } catch (error) {
      console.error('Error searching case law:', error);
      return [];
    }
  }
}

export const ragService = new RAGService();