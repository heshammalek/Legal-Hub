'use client'

import React, { useState, useEffect, useCallback } from 'react'
import LegalEditor from '@/components/editor/LegalEditor'
import {
  Download, Printer, Plus, Sparkles,
  Search, FolderOpen, BookOpen, Scale, FileCheck, Library,
  FileText, X, Copy, CheckCircle, Cpu, Save
} from 'lucide-react'

// تعريف الأنواع
interface Document {
  id: string
  title: string
  content: string
  type: 'contract' | 'lawsuit' | 'judgment' | 'reference' | 'formula' | 'other'
  createdAt: string
  updatedAt: string
  category: string
  tags: string[]
}

interface LibraryItem {
  id: string
  title: string
  content: string
  type: 'contract' | 'lawsuit' | 'judgment' | 'reference' | 'formula'
  category: string
  description: string
  language: 'ar' | 'en'
  lastUsed?: string
}

interface Category {
  id: string
  name: string
  icon: React.ComponentType<any>
  count: number
}

interface AIModel {
  name: string
  provider: string
  description: string
  icon: string
}

// أنواع الموديلات المتاحة
const AI_MODELS: Record<string, AIModel> = {
  chatgpt: {
    name: 'ChatGPT-4',
    provider: 'OpenAI',
    description: 'الأقوى للكتابة الإبداعية',
    icon: '🤖'
  },
  cohere: {
    name: 'Cohere Command',
    provider: 'Cohere',
    description: 'ممتاز للنصوص القانونية',
    icon: '⚡'
  },
  gemini: {
    name: 'Gemini Pro',
    provider: 'Google',
    description: 'ذكاء اصطناعي متقدم من جوجل',
    icon: '🔮'
  },
  deepseek: {
    name: 'DeepSeek',
    provider: 'DeepSeek',
    description: 'نموذج مفتوح المصدر قوي',
    icon: '🚀'
  }
}

export default function LegalDocumentsTab() {
  // States
  const [documents, setDocuments] = useState<Document[]>([])
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([])
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null)
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false)
  const [aiPrompt, setAiPrompt] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('chatgpt')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [aiResponse, setAiResponse] = useState<string>('')
  const [isResponseCopied, setIsResponseCopied] = useState<boolean>(false)
  const [fontSize, setFontSize] = useState('16')
  const [textColor, setTextColor] = useState('#000000')
  const [editorKey, setEditorKey] = useState(0)

  // الحصول على المستند الحالي
  const currentDocument = documents.find(doc => doc.id === currentDocumentId) || null

  // 🔒 كود الاتصال بـ APIs الحقيقية (معلق حالياً)
  /*
  const callAIApi = async (prompt: string, model: string): Promise<string> => {
    try {
      const API_KEYS = {
        openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        cohere: process.env.NEXT_PUBLIC_COHERE_API_KEY,
        gemini: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
        deepseek: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY
      }

      let response: Response;

      switch (model) {
        case 'chatgpt':
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_KEYS.openai}`
            },
            body: JSON.stringify({
              model: 'gpt-4',
              messages: [
                {
                  role: 'system',
                  content: 'أنت مساعد قانوني متخصص في صياغة المستندات القانونية باللغة العربية. قدم نصوصاً قانونية دقيقة ومنظمة بدون إضافة مقدمات أو تواريخ.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_tokens: 2000,
              temperature: 0.7
            })
          })
          break;

        case 'cohere':
          response = await fetch('https://api.cohere.ai/v1/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_KEYS.cohere}`
            },
            body: JSON.stringify({
              model: 'command',
              prompt: `كمساعد قانوني، قم بصياغة النص التالي باللغة العربية بدون إضافة مقدمات: ${prompt}`,
              max_tokens: 2000,
              temperature: 0.7,
              return_likelihoods: 'NONE'
            })
          })
          break;

        case 'gemini':
          response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEYS.gemini}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `بصفتك خبيراً قانونياً، اكتب نصاً قانونياً بالعربية حول: ${prompt} بدون إضافة مقدمات أو تواريخ`
                    }
                  ]
                }
              ]
            })
          })
          break;

        case 'deepseek':
          response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_KEYS.deepseek}`
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [
                {
                  role: 'system',
                  content: 'أنت مساعد قانوني محترف. قم بإنشاء نصوص قانونية باللغة العربية بدقة واحترافية بدون إضافة مقدمات.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_tokens: 2000,
              temperature: 0.7
            })
          })
          break;

        default:
          throw new Error('نموذج غير مدعوم');
      }

      if (!response.ok) {
        throw new Error(`خطأ في API: ${response.status}`);
      }

      const data = await response.json();

      // استخراج النص من الاستجابة حسب كل API
      switch (model) {
        case 'chatgpt':
          return data.choices[0]?.message?.content || 'لم يتم توليد نص';
        
        case 'cohere':
          return data.generations[0]?.text || 'لم يتم توليد نص';
        
        case 'gemini':
          return data.candidates[0]?.content?.parts[0]?.text || 'لم يتم توليد نص';
        
        case 'deepseek':
          return data.choices[0]?.message?.content || 'لم يتم توليد نص';
        
        default:
          return 'نموذج غير مدعوم';
      }

    } catch (error) {
      console.error('API Error:', error);
      throw new Error(`فشل الاتصال بـ ${AI_MODELS[model]?.name}: ${error.message}`);
    }
  }
  */

  // دالة محاكاة الـ API - محسنة
  const mockAICall = async (prompt: string, model: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // نصوص قانونية واقعية بدون مقدمات
        const legalTemplates = {
          contract: `المادة 1: الأطراف
يتعاقد كل من:
الطرف الأول: [اسم الطرف الأول]
الطرف الثاني: [اسم الطرف الثاني]

المادة 2: موضوع العقد
يهدف هذا العقد إلى ${prompt}

المادة 3: المدة
تبدأ مدة هذا العقد من [التاريخ] ولمدة [المدة]

المادة 4: الالتزامات
يلتزم كل طرف بالالتزامات التالية:
1. [الالتزام الأول]
2. [الالتزام الثاني]
3. [الالتزام الثالث]

المادة 5: القيمة المالية
تحدد القيمة المالية بـ [المبلغ] تدفع على النحو التالي:
• [طريقة الدفع الأولى]
• [طريقة الدفع الثانية]`,

          lawsuit: `السياسات:
بناءً على أحكام نظام المرافعات الشرعية والنظام الأساسي للحكم.

الوقائع:
${prompt}

الطلبات:
أطلب من المحكمة الموقرة:
1. [الطلب الأول]
2. [الطلب الثاني]
3. [الطلب الثالث]

الأسباب:
1. [السبب الأول]
2. [السبب الثاني]
3. [السبب الثالث]

المستندات:
• [المستند الأول]
• [المستند الثاني]
• [المستند الثالث]`,

          general: `${prompt}

التفاصيل:
• [النقطة الأولى]
• [النقطة الثانية] 
• [النقطة الثالثة]

الضوابط:
1. يجب الالتزام بالشروط النظامية
2. مراعاة الأحكام الشرعية
3. توثيق جميع البنود
4. تحديد المسؤوليات والالتزامات`
        }

        // تحديد نوع النص بناءً على المحتوى
        let template = legalTemplates.general
        if (prompt.includes('عقد') || prompt.includes('اتفاق') || prompt.includes('عقود')) {
          template = legalTemplates.contract
        } else if (prompt.includes('دعوى') || prompt.includes('قضية') || prompt.includes('محكمة')) {
          template = legalTemplates.lawsuit
        }

        const responses: Record<string, string> = {
          chatgpt: template,
          cohere: template,
          gemini: template,
          deepseek: template
        }
        
        resolve(responses[model] || responses.chatgpt)
      }, 1500)
    })
  }

  // دالة الاتصال بالـ AI - معدلة
  const generateWithAI = useCallback(async (): Promise<void> => {
    if (!aiPrompt.trim() || !currentDocument) return

    setIsGenerating(true)
    setAiResponse('')

    try {
      // ⚠️ استخدام المحاكاة حالياً - استبدل بالكود أعلاه عند تفعيل APIs
      const response = await mockAICall(aiPrompt, selectedModel)
      
      // عند تفعيل APIs الحقيقية، استخدم:
      // const response = await callAIApi(aiPrompt, selectedModel)
      
      setAiResponse(response)
    } catch (error) {
      console.error('AI Generation Error:', error)
      setAiResponse('❌ حدث خطأ في الاتصال بالمساعد الذكي. يرجى المحاولة مرة أخرى.')
    } finally {
      setIsGenerating(false)
    }
  }, [aiPrompt, selectedModel, currentDocument])

  // نسخ الرد
  const copyResponse = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(aiResponse)
      setIsResponseCopied(true)
      setTimeout(() => setIsResponseCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  // إدراج الرد في المحرر - محسنة
  const insertResponse = (): void => {
    if (aiResponse && currentDocument) {
      // إدراج النص مباشرة بدون تنظيف إضافي
      const newContent = currentDocument.content + `\n\n<div class="ai-generated-content">${aiResponse}</div>`
      handleEditorUpdate(newContent)
      setIsAIAssistantOpen(false)
      setAiResponse('')
      setAiPrompt('')
    }
  }

  // تحميل البيانات الأولية
  const loadInitialData = (): void => {
    const mockLibrary: LibraryItem[] = [
      {
        id: '1',
        title: 'عقد إيجار تجاري',
        content: `<h1>عقد إيجار تجاري</h1>
        <p><strong>بسم الله الرحمن الرحيم</strong></p>
        <h2>تمهيد:</h2>
        <p>يعتبر هذا العقد اتفاقاً بين:</p>
        <ul>
          <li>الطرف الأول: المؤجر</li>
          <li>الطرف الثاني: المستأجر</li>
        </ul>
        <h3>المادة 1: محل العقد</h3>
        <p>يؤجر الطرف الأول للطرف الثاني العقار الواقع في [عنوان العقار]</p>
        <h3>المادة 2: مدة العقد</h3>
        <p>تبدأ مدة هذا العقد من [تاريخ البدء] إلى [تاريخ الانتهاء]</p>
        <h3>المادة 3: القيمة الإيجارية</h3>
        <p>تحدد القيمة الإيجارية بمبلغ [المبلغ] يدفع على النحو التالي...</p>`,
        type: 'contract',
        category: 'contracts',
        description: 'نموذج عقد إيجار للأغراض التجارية',
        language: 'ar'
      },
      {
        id: '2',
        title: 'دعوى تعويض عن ضرر',
        content: `<h1>دعوى تعويض عن الأضرار</h1>
        <h2>دعوى تعويض عن الأضرار المادية والمعنوية</h2>
        <h3>المقدمة:</h3>
        <p>بناءً على أحكام النظام الأساسي للحكم ونظام المرافعات الشرعية...</p>
        <p>فإن المدعي يطلب التعويض عن الأضرار التالية:</p>
        <ol>
          <li>الأضرار المادية المتمثلة في...</li>
          <li>الأضرار المعنوية الناتجة عن...</li>
          <li>التكاليف والمصاريف القضائية</li>
        </ol>
        <h3>الطلبات:</h3>
        <p>بناءً على ما تقدم، أطلب من المحكمة الموقرة:</p>
        <ol>
          <li>الحكم بالتعويض المناسب</li>
          <li>تحميل المدعى عليه المصاريف</li>
        </ol>`,
        type: 'lawsuit',
        category: 'lawsuits',
        description: 'نموذج دعوى للمطالبة بالتعويض عن الأضرار',
        language: 'ar'
      },
      {
        id: '3',
        title: 'عقد عمل',
        content: `<h1>عقد عمل</h1>
        <p><strong>بسم الله الرحمن الرحيم</strong></p>
        <h2>تمهيد:</h2>
        <p>يعتبر هذا العقد اتفاقاً بين:</p>
        <ul>
          <li>الطرف الأول: صاحب العمل</li>
          <li>الطرف الثاني: العامل</li>
        </ul>
        <h3>المادة 1: طبيعة العمل</h3>
        <p>يعمل الطرف الثاني في وظيفة [الوظيفة]</p>
        <h3>المادة 2: مدة العقد</h3>
        <p>تبدأ مدة العقد من [التاريخ] ولمدة [المدة]</p>
        <h3>المادة 3: الراتب والمزايا</h3>
        <p>يتقاضى العامل راتباً قدره [الراتب]</p>`,
        type: 'contract',
        category: 'contracts',
        description: 'نموذج عقد عمل شامل',
        language: 'ar'
      }
    ]
    setLibraryItems(mockLibrary)
  }

  // إنشاء مستند جديد
  const createNewDocument = (): void => {
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: `مستند جديد ${documents.length + 1}`,
      content: `<h1>مستند جديد</h1>
        <p>ابدأ الكتابة هنا...</p>`,
      type: 'other',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: 'other',
      tags: []
    }
    setDocuments(prev => [...prev, newDoc])
    setCurrentDocumentId(newDoc.id)
    setEditorKey(prev => prev + 1)
  }

  // تحديث محتوى المستند
  const handleEditorUpdate = (content: string): void => {
    if (currentDocument) {
      const updatedDoc: Document = {
        ...currentDocument,
        content: content,
        updatedAt: new Date().toISOString()
      }
      setDocuments(prev => 
        prev.map(doc => doc.id === currentDocument.id ? updatedDoc : doc)
      )
    }
  }

  // حفظ المستند
  const saveDocument = (): void => {
    if (!currentDocument) return

    try {
      // حفظ في localStorage
      const allDocuments = documents.map(doc => 
        doc.id === currentDocument.id ? currentDocument : doc
      )
      
      localStorage.setItem('legal-documents', JSON.stringify(allDocuments))
      
      // عرض رسالة نجاح
      alert('✅ تم حفظ المستند بنجاح!')
      console.log('✅ تم حفظ المستند:', currentDocument.title)
      
    } catch (error) {
      console.error('❌ خطأ في حفظ المستند:', error)
      alert('❌ حدث خطأ أثناء حفظ المستند')
    }
  }

  // تحميل المستند كملف
  const downloadDocument = (): void => {
    if (!currentDocument) return

    const cleanContent = currentDocument.content
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    const content = `
${currentDocument.title}
${'='.repeat(currentDocument.title.length)}

${cleanContent}

${'-'.repeat(40)}
تم إنشاؤه بواسطة المنصة القانونية الذكية
التاريخ: ${new Date().toLocaleString('ar-SA')}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentDocument.title}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // طباعة المستند - محسنة بشكل كامل
  const printDocument = (): void => {
    if (!currentDocument) return
    
    // إنشاء نافذة جديدة للطباعة
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة للطباعة')
      return
    }

    // تنظيف المحتوى للطباعة - إزالة أي عناوين مكررة
    let cleanContent = currentDocument.content;
    
    // إزالة جميع العناوين والتواريخ الموجودة في المحتوى
    cleanContent = cleanContent
      .replace(/<div class="document-header"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<div class="print-header"[^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '')
      .replace(/التاريخ:.*?<\/p>/g, '')
      .replace(/<div class="ai-suggestion">/g, '<div class="ai-suggestion">')
      .replace(/<div class="ai-generated-content">/g, '<div class="ai-generated-content">')

    // بناء محتوى الطباعة مع عنوان واحد فقط
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${currentDocument.title}</title>
        <style>
          @media print {
            body { 
              margin: 0;
              padding: 1cm;
              font-family: 'Traditional Arabic', 'Arial', sans-serif;
              line-height: 1.8;
              color: #000;
              font-size: 14pt;
              background: white;
            }
            .no-print { display: none !important; }
            .print-header {
              text-align: center;
              margin-bottom: 2em;
              border-bottom: 2px solid #1e40af;
              padding-bottom: 1em;
              page-break-after: avoid;
            }
            .print-title {
              color: #1e40af;
              margin: 0;
              font-size: 20pt;
              border-bottom: none;
            }
            .print-date {
              color: #666;
              margin: 0.5em 0 0 0;
              font-size: 12pt;
            }
            h1, h2, h3 { 
              color: #1e40af; 
              margin: 1em 0 0.5em 0;
              page-break-after: avoid;
            }
            h1 { 
              font-size: 18pt; 
              border-bottom: 1px solid #1e40af; 
              padding-bottom: 0.5em; 
            }
            h2 { font-size: 16pt; }
            h3 { font-size: 14pt; }
            p { 
              margin: 0.5em 0; 
              text-align: justify;
            }
            ul, ol { 
              margin: 1em 0; 
              padding-right: 2em;
            }
            li { 
              margin: 0.5em 0;
              line-height: 1.6;
            }
            ul { list-style-type: disc; }
            ol { list-style-type: decimal; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1em 0;
              page-break-inside: avoid;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: right;
            }
            th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            .ai-generated-content {
              border-right: 3px solid #10b981;
              background: #f0fdf4;
              padding: 1rem;
              margin: 1rem 0;
              border-radius: 0.5rem;
              page-break-inside: avoid;
            }
            .ai-suggestion {
              border: 1px solid #e5e7eb;
              padding: 1rem;
              margin: 1rem 0;
              background: #f9fafb;
              border-radius: 0.5rem;
              page-break-inside: avoid;
            }
            .print-footer {
              margin-top: 3em;
              padding-top: 1em;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 10pt;
              color: #666;
            }
            @page {
              margin: 1cm;
              size: A4;
            }
            @page :first {
              margin-top: 2cm;
            }
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          
          @media screen {
            body {
              margin: 1cm;
              padding: 0;
              font-family: 'Traditional Arabic', 'Arial', sans-serif;
              line-height: 1.8;
              color: #000;
              font-size: 14pt;
              background: white;
            }
            .print-header {
              text-align: center;
              margin-bottom: 2em;
              border-bottom: 2px solid #1e40af;
              padding-bottom: 1em;
            }
          }
        </style>
      </head>
      <body>
        <!-- عنوان واحد فقط للطباعة -->
        <div class="print-header">
          <h1 class="print-title">${currentDocument.title}</h1>
          <p class="print-date">التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        
        <!-- المحتوى بدون عناوين مكررة -->
        ${cleanContent}
        
        <div class="print-footer">
          تم إنشاؤه بواسطة المنصة القانونية الذكية - ${new Date().toLocaleDateString('ar-SA')}
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }, 500);
          }
          
          window.onafterprint = function() {
            setTimeout(function() {
              window.close();
            }, 500);
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  // فتح مستند من المكتبة
  const openLibraryItem = (item: LibraryItem): void => {
    const newDocument: Document = {
      id: `lib-${item.id}-${Date.now()}`,
      title: item.title,
      content: item.content,
      type: item.type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: item.category,
      tags: ['من المكتبة']
    }
    setDocuments(prev => [...prev, newDocument])
    setCurrentDocumentId(newDocument.id)
    setIsLibraryOpen(false)
    setEditorKey(prev => prev + 1)
  }

  // إغلاق مستند
  const closeDocument = (docId: string, e?: React.MouseEvent): void => {
    if (e) {
      e.stopPropagation()
    }
    
    setDocuments(prev => prev.filter(doc => doc.id !== docId))
    
    if (currentDocumentId === docId) {
      const remainingDocs = documents.filter(doc => doc.id !== docId)
      setCurrentDocumentId(remainingDocs.length > 0 ? remainingDocs[0].id : null)
    }
  }

  // الفلترة والبحث
  const filteredLibraryItems = libraryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // الفئات المتاحة
  const categories: Category[] = [
    { id: 'all', name: 'جميع المستندات', icon: Library, count: libraryItems.length },
    { id: 'contracts', name: 'العقود', icon: FileCheck, count: libraryItems.filter(item => item.category === 'contracts').length },
    { id: 'lawsuits', name: 'الدعاوى', icon: Scale, count: libraryItems.filter(item => item.category === 'lawsuits').length }
  ]

  useEffect(() => {
    loadInitialData()
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* الشريط العلوي */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              📝 المحرر القانوني المتقدم
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={createNewDocument}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
            >
              <Plus size={18} />
              مستند جديد
            </button>
            
            <button
              onClick={saveDocument}
              disabled={!currentDocument}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
            >
              <Save size={18} />
              حفظ
            </button>

            <button
              onClick={downloadDocument}
              disabled={!currentDocument}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
            >
              <Download size={18} />
              تحميل
            </button>

            <button
              onClick={printDocument}
              disabled={!currentDocument}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
            >
              <Printer size={18} />
              طباعة
            </button>

            <button
              onClick={() => setIsAIAssistantOpen(true)}
              disabled={!currentDocument}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
            >
              <Sparkles size={18} />
              مساعد ذكي
            </button>
          </div>
        </div>

        {/* تبويبات المستندات المفتوحة */}
        <div className="flex gap-1 overflow-x-auto">
          {documents.map(doc => (
            <div
              key={doc.id}
              onClick={() => {
                setCurrentDocumentId(doc.id)
                setEditorKey(prev => prev + 1)
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-t-lg border-b-2 transition-colors cursor-pointer min-w-0 max-w-xs ${
                currentDocumentId === doc.id
                  ? 'bg-white dark:bg-gray-700 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <FileText size={16} />
              <span className="truncate text-sm flex-1">{doc.title}</span>
              <button
                onClick={(e) => closeDocument(doc.id, e)}
                className="p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="flex flex-1 overflow-hidden">
        {/* المكتبة الجانبية */}
        {isLibraryOpen && (
          <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  المكتبة القانونية
                </h2>
                <button
                  onClick={() => setIsLibraryOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="ابحث في المكتبة..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                />
              </div>

              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg whitespace-nowrap transition-colors text-sm ${
                      selectedCategory === category.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <category.icon size={16} />
                    <span>{category.name}</span>
                    <span className="text-xs opacity-75">({category.count})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredLibraryItems.length === 0 ? (
                <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>لا توجد عناصر مطابقة للبحث</p>
                </div>
              ) : (
                filteredLibraryItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => openLibraryItem(item)}
                    className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                        <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-1 text-sm">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-xs text-gray-600 dark:text-gray-400">
                            {item.type}
                          </span>
                          <span className="text-xs text-blue-500 dark:text-blue-400">
                            انقر لفتح
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* منطقة المحرر */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 relative">
          {!isLibraryOpen && (
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="absolute top-4 left-4 z-10 p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="فتح المكتبة"
            >
              <Library size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          )}

          {currentDocument ? (
            <div className="flex-1 overflow-auto">
              <LegalEditor 
                key={editorKey}
                content={currentDocument.content}
                onUpdate={handleEditorUpdate}
                fontSize={fontSize}
                textColor={textColor}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <FileText size={64} className="text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                لا يوجد مستند مفتوح
              </h3>
              <p className="text-gray-500 dark:text-gray-500 mb-6 max-w-md">
                اختر مستنداً من المكتبة أو أنشئ مستنداً جديداً للبدء في الكتابة
              </p>
              <div className="flex gap-4">
                <button
                  onClick={createNewDocument}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  إنشاء مستند جديد
                </button>
                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  <Library size={20} />
                  فتح المكتبة
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* نافذة المساعد الذكي المحسنة */}
      {isAIAssistantOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <Cpu size={24} />
                  المساعد الذكي للكتابة القانونية
                </h3>
                <button
                  onClick={() => {
                    setIsAIAssistantOpen(false)
                    setAiResponse('')
                    setAiPrompt('')
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* اختيار الموديل */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اختر نموذج الذكاء الاصطناعي:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(AI_MODELS).map(([key, model]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedModel(key)}
                      className={`p-3 border rounded-lg text-left transition-all ${
                        selectedModel === key
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{model.icon}</span>
                        <span className="font-medium text-sm">{model.name}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {model.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* الإدخال */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <textarea
                  value={aiPrompt}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAiPrompt(e.target.value)}
                  placeholder="صف ما تريد كتابته (مثال: اكتب مقدمة لعقد شراكة تجارية)..."
                  className="w-full h-32 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none direction-rtl text-sm"
                />
                
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={generateWithAI}
                    disabled={!aiPrompt.trim() || isGenerating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        جاري التوليد...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        توليد النص ({AI_MODELS[selectedModel]?.name})
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsAIAssistantOpen(false)
                      setAiResponse('')
                      setAiPrompt('')
                    }}
                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </div>

              {/* الرد */}
              {aiResponse && (
                <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800 dark:text-white">
                        الرد من {AI_MODELS[selectedModel]?.name}:
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={copyResponse}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                        >
                          {isResponseCopied ? <CheckCircle size={16} /> : <Copy size={16} />}
                          {isResponseCopied ? 'تم النسخ!' : 'نسخ'}
                        </button>
                        <button
                          onClick={insertResponse}
                          className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                        >
                          إدراج في المحرر
                        </button>
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {aiResponse}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* إضافة CSS مخصص */}
      <style jsx global>{`
        .ai-generated-content {
          border-right: 3px solid #10b981;
          background: #f0fdf4;
          padding: 1rem;
          margin: 1rem 0;
          border-radius: 0.5rem;
        }
        
        .ai-suggestion {
          border: 1px solid #e5e7eb;
          padding: 1rem;
          margin: 1rem 0;
          background: #f9fafb;
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  )
}