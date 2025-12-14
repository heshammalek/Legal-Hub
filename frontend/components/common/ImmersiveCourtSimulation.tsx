// frontend/components/dashboard/ImmersiveCourtSimulation.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';

// مؤقتاً: استبدال الـ 3D بواجهة بصرية
const CourtroomVisualization: React.FC = () => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden relative">
      {/* خلفية قاعة المحكمة */}
      <div className="absolute inset-0 bg-[url('/api/placeholder/800/600')] bg-cover bg-center opacity-20"></div>
      
      {/* عناصر قاعة المحكمة */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6">
        
        {/* منصة القاضي */}
        <div className="flex justify-center">
          <div className="bg-yellow-800 px-8 py-4 rounded-lg text-center transform -skew-x-6 shadow-2xl">
            <div className="transform skew-x-6">
              <div className="text-2xl">👨‍⚖️</div>
              <div className="text-white font-bold mt-2">منصة القاضي</div>
            </div>
          </div>
        </div>

        {/* المنطقة الوسطى */}
        <div className="flex justify-between items-center px-8">
          
          {/* مكان المحامي */}
          <div className="bg-green-700 px-6 py-3 rounded-lg text-center">
            <div className="text-xl">👨‍💼</div>
            <div className="text-white text-sm mt-1">المحامي</div>
          </div>

          {/* منصة الشاهد */}
          <div className="bg-blue-600 px-6 py-3 rounded-full">
            <div className="text-xl">🗣️</div>
            <div className="text-white text-sm mt-1">الشاهد</div>
          </div>

          {/* الخصم */}
          <div className="bg-red-600 px-6 py-3 rounded-lg text-center">
            <div className="text-xl">👨‍⚖️</div>
            <div className="text-white text-sm mt-1">الخصم</div>
          </div>

        </div>

        {/* الجمهور */}
        <div className="flex justify-center space-x-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-xs">👥</span>
            </div>
          ))}
        </div>

      </div>

      {/* تأثيرات بصرية */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      </div>
    </div>
  );
};

// الأنواع
interface Character {
  name: string;
  role: string;
  voice_profile?: string;
}

interface Scenario {
  facts?: string;
  characters?: Character[];
  evidence?: Evidence[];
}

interface Evidence {
  type: string;
  id: string;
  description?: string;
}

interface Session {
  session_id: string;
  scenario: Scenario;
}

const ImmersiveCourtSimulation: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [gameState, setGameState] = useState('idle');
  const [score, setScore] = useState(100);
  const [characterAnimations, setCharacterAnimations] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(1500); // 25 دقيقة

  // مؤقت التنازلي
  useEffect(() => {
    if (gameState !== 'active') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startGame = async () => {
    setGameState('loading');
    try {
      // محاكاة API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockSession: Session = {
        session_id: 'session_123',
        scenario: {
          facts: 'قضية تجارية بين شركتين حول عقد توريد بضائع. المدعي يدعي عدم استلام البضائع بالكامل، بينما المدعى عليه يؤكد الالتزام بالعقد.',
          characters: [
            { name: 'القاضي أحمد', role: 'قاضي المحكمة' },
            { name: 'المحامي خالد', role: 'محامي المدعي' },
            { name: 'المحامي محمد', role: 'محامي المدعى عليه' },
            { name: 'الشاهد سعيد', role: 'مدير المستودع' }
          ],
          evidence: [
            { id: '1', type: '📄 العقد', description: 'عقد التوريد الأصلي' },
            { id: '2', type: '📧 الإيميلات', description: 'مراسلات بين الطرفين' },
            { id: '3', type: '🧾 الفواتير', description: 'فواتير الدفع' },
            { id: '4', type: '📸 الصور', description: 'صور البضاعة المستلمة' }
          ]
        }
      };
      
      setSession(mockSession);
      setGameState('active');
      
    } catch (error) {
      console.error('Error starting game:', error);
      setGameState('error');
    }
  };

  const handleVoiceResponse = async () => {
    if (!session) return;
    
    setIsRecording(true);
    
    try {
      // محاكاة معالجة الصوت
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // نتائج محاكاة
      setScore(prev => prev + Math.floor(Math.random() * 10) - 3);
      triggerAnimation('judge_nod');
      
      // محاكاة ردود الشخصيات
      setTimeout(() => {
        triggerAnimation('witness_speaking');
      }, 1000);
      
    } catch (error) {
      console.error('Error in voice response:', error);
    } finally {
      setIsRecording(false);
    }
  };

  const triggerAnimation = (animation: string) => {
    setCharacterAnimations(prev => [...prev, animation]);
    setTimeout(() => {
      setCharacterAnimations(prev => prev.filter(a => a !== animation));
    }, 3000);
  };

  const presentEvidence = (evidenceId: string) => {
    if (!session) return;
    
    setScore(prev => prev + 5);
    triggerAnimation('evidence_presented');
    
    // تأثير عرض الدليل
    const evidence = session.scenario.evidence?.find(e => e.id === evidenceId);
    if (evidence) {
      console.log(`عرض الدليل: ${evidence.type}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Game Header */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">⚖️ محاكاة المحكمة الغامرة</h1>
          <div className="flex items-center gap-4">
            <div className="bg-red-600 px-4 py-2 rounded-lg">
              ⏱️ {formatTime(timeRemaining)}
            </div>
            <div className="bg-blue-600 px-4 py-2 rounded-lg">
              🏆 {score} نقطة
            </div>
            <div className={`px-4 py-2 rounded-lg ${
              gameState === 'active' ? 'bg-green-600' : 'bg-yellow-600'
            }`}>
              {gameState === 'active' ? '🟢 نشط' : '🟡 جاري التحميل'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        
        {/* Courtroom Visualization */}
        <div className="lg:col-span-2 rounded-xl h-96 lg:h-[600px]">
          <CourtroomVisualization />
        </div>

        {/* Game Interface */}
        <div className="space-y-6">
          
          {/* Scenario Info */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-2">📋 وقائع القضية</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {session?.scenario?.facts || 'جاري تحميل القضية...'}
            </p>
          </div>

          {/* Characters */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-2">👥 الشخصيات</h3>
            <div className="space-y-2">
              {session?.scenario?.characters?.map((char: Character) => (
                <div key={char.name} className="flex items-center gap-3 p-2 bg-gray-700 rounded-lg transition-all hover:bg-gray-600">
                  <div className={`w-3 h-3 rounded-full ${
                    characterAnimations.includes(`${char.name.replace(' ', '_')}_speaking`) 
                      ? 'bg-green-500 animate-pulse' 
                      : 'bg-gray-500'
                  }`}></div>
                  <div className="flex-1">
                    <div className="font-medium">{char.name}</div>
                    <div className="text-xs text-gray-400">{char.role}</div>
                  </div>
                  <div className="text-xs bg-gray-600 px-2 py-1 rounded">
                    {characterAnimations.includes(`${char.name.replace(' ', '_')}_speaking`) ? '🎤 يتحدث' : '⚪ صامت'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voice Controls */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-4">🎤 التحكم الصوتي</h3>
            <button
              onClick={handleVoiceResponse}
              disabled={isRecording || !session}
              className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
                isRecording 
                  ? 'bg-red-600 animate-pulse' 
                  : session 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              {isRecording ? '🎤 جاري التسجيل...' : '🎤 ابدأ الكلام'}
            </button>
            <div className="mt-4 text-sm text-gray-400">
              💡 انطق دفاعك بصوت واضح. سيحلل القاضي حجتك فوراً.
            </div>
          </div>

          {/* Evidence */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-2">📁 الأدلة</h3>
            <div className="grid grid-cols-2 gap-2">
              {session?.scenario?.evidence?.map((evidence: Evidence) => (
                <button
                  key={evidence.id}
                  onClick={() => presentEvidence(evidence.id)}
                  className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 text-sm transition-all flex items-center gap-2"
                >
                  <span>{evidence.type.split(' ')[0]}</span>
                  <span className="flex-1 text-right">{evidence.type.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Game Start Button */}
      {!session && gameState !== 'loading' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">🎮 محاكاة المحكمة الغامرة</h2>
            <p className="text-xl mb-8 max-w-2xl leading-relaxed">
              استعد لأكثر تجربة تعليمية واقعية في القانون. 
              تفاعل مع القاضي، قدم الأدلة، وادفع بحججك في بيئة محكمة افتراضية كاملة.
            </p>
            <button
              onClick={startGame}
              className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 rounded-lg text-xl font-semibold hover:scale-105 transition-transform shadow-2xl"
            >
              🚀 بدء المحاكاة
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {gameState === 'loading' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-xl">جاري تحميل المحاكاة...</p>
            <p className="text-gray-400 mt-2">يتم إعداد قاعة المحكمة الافتراضية</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImmersiveCourtSimulation;