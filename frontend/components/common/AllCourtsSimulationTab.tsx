'use client';

import React, { useState } from 'react';

const EnhancedCourtSimulation: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [lawyerResponse, setLawyerResponse] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  // حالة اختيار القضية
  const [selectedCaseType, setSelectedCaseType] = useState('جنائي');
  const [selectedSource, setSelectedSource] = useState('predefined');

  // المرحلة 1: قضايا مسبقة الصنع (جاهزة الآن)
  const predefinedCases = {
    جنائي: [
      { 
        id: 1, 
        title: "قضية سرقة مسلحة", 
        difficulty: "متوسط", 
        facts: "المتهم ينكر تهمة السرقة المسلحة لمحل مجوهرات. يوجد تسجيلات كاميرات ولكنه يدعي بالغيبة.",
        judge: "القاضي أحمد محمد",
        opponent: "المدعي العام سمير فتحي",
        initial_question: "🚨 كيف ترد على ادعاء المدعي بوجود بصمة عميل في مسرح الجريمة؟"
      },
      { 
        id: 2, 
        title: "قضية قتل خطأ", 
        difficulty: "صعب", 
        facts: "قضية حادث سير نتج عنها وفاة. المتهم ينكر التهمة ويقدم دفاعاً بعدم التعمد.",
        judge: "القاضي محمود السيد",
        opponent: "النيابة العامة",
        initial_question: "⚖️ كيف تثبت أن الحادث كان غير متعمد؟"
      }
    ],
    تجاري: [
      { 
        id: 3, 
        title: "نزاع على عقد توريد", 
        difficulty: "متوسط", 
        facts: "نزاع بين شركتين حول عقد توريد بضائع منتهية الصلاحية. المدعي يطالب بالتعويض.",
        judge: "القاضي خالد عبد الرحمن", 
        opponent: "محامي الشركة المدعية",
        initial_question: "💼 ما ردك على ادعاء المدعي بوجود عيوب خفية في البضاعة؟"
      }
    ],
    أحوال_شخصية: [
      { 
        id: 4, 
        title: "قضية طلاق للنشوز", 
        difficulty: "سهل", 
        facts: "قضية طلاق بسبب النشوز، كلا الطرفين يقدم أدلة على إساءة المعاملة.",
        judge: "القاضي منى محمود",
        opponent: "محامي الزوجة",
        initial_question: "👨‍👩‍👧 كيف تثبت صحة ادعاءات موكلك في قضية النشوز؟"
      }
    ]
  };

  // المرحلة 2: دمج RAG system (كومنت للتنفيذ لاحقاً)
  /*
  const generateCaseFromRAG = async (legalField: string) => {
    try {
      const response = await fetch(`/api/ai/rag/generate-case?field=${legalField}`);
      const caseData = await response.json();
      return caseData;
    } catch (error) {
      console.error('Error generating case from RAG:', error);
      return null;
    }
  };
  */

  // المرحلة 3: مسائل من المشرفين (كومنت للتنفيذ لاحقاً)
  /*
  const fetchSupervisorCases = async (caseType: string) => {
    try {
      const response = await fetch(`/api/supervisor/cases?type=${caseType}`);
      const cases = await response.json();
      return cases;
    } catch (error) {
      console.error('Error fetching supervisor cases:', error);
      return [];
    }
  };
  */

  // المرحلة 4: التوليد التلقائي بالذكاء الاصطناعي (كومنت للتنفيذ لاحقاً)
  /*
  const generateAICase = async (specifications: any) => {
    try {
      const response = await fetch('/api/ai/generate-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specifications)
      });
      const aiCase = await response.json();
      return aiCase;
    } catch (error) {
      console.error('Error generating AI case:', error);
      return null;
    }
  };
  */

  const startNewSession = async () => {
    // حالياً: استخدام القضايا المسبقة فقط
    const cases = predefinedCases[selectedCaseType as keyof typeof predefinedCases];
    const selectedCase = cases[0]; // نأخذ أول قضية للمثال
    
    const mockSession = {
      session_id: 'session_' + Date.now(),
      case_type: selectedCaseType,
      source: selectedSource,
      scenario: {
        title: selectedCase.title,
        facts: selectedCase.facts,
        judge: selectedCase.judge,
        opponent: selectedCase.opponent,
        difficulty: selectedCase.difficulty
      }
    };
    
    setSession(mockSession);
    
    // محاكاة بدء الجلسة
    setTimeout(() => {
      setFeedback({
        judge_question: selectedCase.initial_question,
        case_details: `📊 مستوى الصعوبة: ${selectedCase.difficulty}`
      });
    }, 1500);
  };

  const handleVoiceRecord = () => {
    setIsRecording(true);
    // محاكاة تسجيل صوتي قصير
    setTimeout(() => {
      setIsRecording(false);
      setLawyerResponse('أطلب سماع شهادة الشاهد رقم 3 للإثبات أن المتهم كان خارج المدينة');
      submitResponse();
    }, 3000);
  };

  const submitResponse = async () => {
    if (!lawyerResponse.trim()) return;
    
    // محاكاة رد القاضي (سيتم استبدالها بالـ RAG لاحقاً)
    const mockFeedback = {
      judge_feedback: '✅ حجة مقبولة. سيتم استدعاء الشاهد.',
      score: Math.floor(Math.random() * 30) + 70, // 70-100
      next_question: '🧠 القاضي: "كيف تثبت مصداقية هذا الشاهد؟"',
      analysis: '📈 استخدمت الدفاع بالغيبة بشكل مناسب'
    };
    
    setFeedback(mockFeedback);
  };

  const presentEvidence = (evidenceType: string) => {
    setFeedback({
      evidence_used: `📁 قدمت ${evidenceType}`,
      judge_response: '🔍 القاضي: "هذا الدليل مقبول. تابع..."',
      score_boost: '+5 نقاط'
    });
  };

  const resetSimulation = () => {
    setSession(null);
    setFeedback(null);
    setLawyerResponse('');
  };

  if (!session) {
    return (
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg min-h-screen">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">🎯 محاكاة المحكمة التفاعلية</h2>
        
        {/* كيف تعمل؟ */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-200 mb-8">
          <h3 className="text-xl font-semibold text-blue-700 mb-4 text-center">🎮 طريقة العمل</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">1️⃣</div>
              <div className="font-semibold text-blue-800">اختر القضية</div>
              <div className="text-sm text-blue-600 mt-1">حدد النوع والمصدر</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">2️⃣</div>
              <div className="font-semibold text-green-800">استمع للقاضي</div>
              <div className="text-sm text-green-600 mt-1">أسئلة وإشكالات قانونية</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">3️⃣</div>
              <div className="font-semibold text-yellow-800">ارد بالصوت</div>
              <div className="text-sm text-yellow-600 mt-1">استخدم صوتك أو الكتابة</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl mb-2">4️⃣</div>
              <div className="font-semibold text-purple-800">احصل على تقييم</div>
              <div className="text-sm text-purple-600 mt-1">تحليل فوري لأدائك</div>
            </div>
          </div>
        </div>

        {/* اختيار القضية */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">📂 اختر القضية</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* نوع القضية */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📋 نوع القضية:
              </label>
              <select 
                value={selectedCaseType}
                onChange={(e) => setSelectedCaseType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="جنائي">🔫 قضية جنائية</option>
                <option value="تجاري">💼 قضية تجارية</option>
                <option value="أحوال_شخصية">👨‍👩‍👧 قضية أحوال شخصية</option>
              </select>
            </div>

            {/* مصدر القضية */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📚 مصدر القضية:
              </label>
              <select 
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="predefined">📝 مسائل جاهزة</option>
                {/* المرحلة 2: سيتم تفعيل لاحقاً
                <option value="rag">🤖 قاعدة المعرفة (RAG)</option>
                <option value="supervisor">👨‍💼 مسائل من المشرفين</option>
                <option value="ai">✨ توليد تلقائي</option>
                */}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                حالياً: المسائل الجاهزة فقط - سيتم تفعيل المصادر الأخرى قريباً
              </p>
            </div>
          </div>

          {/* عرض القضايا المتاحة */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-700 mb-3">📁 القضايا المتاحة:</h4>
            <div className="space-y-3">
              {predefinedCases[selectedCaseType as keyof typeof predefinedCases]?.map((caseItem: any) => (
                <div key={caseItem.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-semibold text-gray-800">{caseItem.title}</h5>
                      <p className="text-sm text-gray-600 mt-1">{caseItem.facts}</p>
                    </div>
                    <div className="bg-blue-100 px-2 py-1 rounded text-xs text-blue-800 font-semibold">
                      {caseItem.difficulty}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* زر البدء */}
        <button 
          onClick={startNewSession}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-4 rounded-lg text-xl font-semibold transition-all shadow-lg"
        >
          🚀 بدء المحاكاة
        </button>

        {/* ملاحظة التطوير */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">🛠️ قيد التطوير</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• ✅ المرحلة 1: المسائل الجاهزة (مفعلة)</li>
            <li>• 🚧 المرحلة 2: التكامل مع RAG system</li>
            <li>• 🚧 المرحلة 3: مسائل المشرفين</li>
            <li>• 🚧 المرحلة 4: التوليد التلقائي بالذكاء الاصطناعي</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg shadow-lg min-h-screen">
      {/* Header مع زر الخروج */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">⚖️ جلسة المحاكاة</h2>
        <div className="flex gap-4 items-center">
          <div className="bg-green-100 px-3 py-1 rounded-full text-green-800 font-semibold">
            🏆 {feedback?.score || 0} نقطة
          </div>
          <button 
            onClick={resetSimulation}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all"
          >
            🏃 الخروج
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Court Visualization */}
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 text-white">
          <div className="flex flex-col items-center justify-between h-64">
            {/* القاضي */}
            <div className="bg-yellow-600 px-6 py-3 rounded-lg text-center">
              <div className="text-2xl">👨‍⚖️</div>
              <div className="text-sm">{session.scenario.judge}</div>
              <div className="text-xs text-yellow-200">القاضي</div>
            </div>

            {/* المحامي والخصم */}
            <div className="flex justify-between w-full px-8">
              <div className="bg-green-600 px-4 py-2 rounded-lg text-center">
                <div className="text-xl">👨‍💼</div>
                <div className="text-xs">أنت (المحامي)</div>
              </div>
              
              <div className="bg-red-600 px-4 py-2 rounded-lg text-center">
                <div className="text-xl">👨‍⚖️</div>
                <div className="text-xs">{session.scenario.opponent}</div>
                <div className="text-xs text-red-200">الخصم</div>
              </div>
            </div>

            {/* الجمهور */}
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-xs">👥</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interaction Panel */}
        <div className="space-y-4">
          
          {/* معلومات القضية */}
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="font-semibold text-gray-800 mb-2">📋 {session.scenario.title}</h3>
            <p className="text-gray-600 text-sm">{session.scenario.facts}</p>
            <div className="flex gap-2 mt-2">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">نوع: {session.case_type}</span>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">مصدر: {session.source}</span>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">صعوبة: {session.scenario.difficulty}</span>
            </div>
          </div>

          {/* الرد */}
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="font-semibold text-gray-800 mb-2">💬 ردك</h3>
            <textarea
              value={lawyerResponse}
              onChange={(e) => setLawyerResponse(e.target.value)}
              className="w-full p-3 border rounded-lg h-24 text-sm"
              placeholder="اكتب ردك أو استخدم التسجيل الصوتي..."
            />
            
            <div className="flex gap-2 mt-2">
              <button 
                onClick={handleVoiceRecord}
                disabled={isRecording}
                className={`flex-1 py-2 rounded-lg font-semibold ${
                  isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isRecording ? '🎤 جاري التسجيل...' : '🎤 تسجيل صوتي'}
              </button>
              
              <button 
                onClick={submitResponse}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
              >
                📤 إرسال
              </button>
            </div>
          </div>

          {/* الأدلة */}
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="font-semibold text-gray-800 mb-2">📁 الأدلة المتاحة</h3>
            <div className="grid grid-cols-2 gap-2">
              {['صور الجريمة', 'شهادة الشاهد', 'التقرير الطبي', 'السجل الزمني'].map((evidence, idx) => (
                <button
                  key={idx}
                  onClick={() => presentEvidence(evidence)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-all"
                >
                  {evidence}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="mt-6 space-y-3">
          {feedback.judge_question && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="font-semibold text-yellow-800">⚖️ سؤال القاضي:</div>
              <div className="text-yellow-700 mt-1">{feedback.judge_question}</div>
            </div>
          )}
          
          {feedback.judge_feedback && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="font-semibold text-green-800">✅ تقييم القاضي:</div>
              <div className="text-green-700 mt-1">{feedback.judge_feedback}</div>
              {feedback.score && (
                <div className="mt-2 text-green-600 font-semibold">
                  النتيجة: {feedback.score}/100
                </div>
              )}
              {feedback.analysis && (
                <div className="mt-2 text-sm text-green-600">
                  📈 {feedback.analysis}
                </div>
              )}
            </div>
          )}
          
          {feedback.next_question && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="font-semibold text-blue-800">🧠 السؤال التالي:</div>
              <div className="text-blue-700 mt-1">{feedback.next_question}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedCourtSimulation;