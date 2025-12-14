// frontend/components/dashboard/CourtSimulationTab.tsx
'use client';

import React, { useState } from 'react';

const CourtSimulationTab: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [lawyerResponse, setLawyerResponse] = useState('');
  const [feedback, setFeedback] = useState<any>(null);

  const startNewSession = async (caseType: string, difficulty: string) => {
    const response = await fetch('/api/v1/court-simulation/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_type: caseType, difficulty })
    });
    const sessionData = await response.json();
    setSession(sessionData);
  };

  const submitResponse = async () => {
    const response = await fetch('/api/v1/court-simulation/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: session.session_id,
        response: lawyerResponse
      })
    });
    const feedbackData = await response.json();
    setFeedback(feedbackData);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">⚖️ محاكاة المحكمة الافتراضية</h2>
      
      {!session ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => startNewSession('جنائي', 'متوسط')} 
            className="p-4 bg-red-100 rounded-lg hover:bg-red-200">
            🔫 قضية جنائية
          </button>
          <button onClick={() => startNewSession('تجاري', 'متوسط')}
            className="p-4 bg-blue-100 rounded-lg hover:bg-blue-200">
            💼 قضية تجارية
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* وقائع القضية */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">📋 وقائع القضية</h3>
            <p>{session.scenario.facts}</p>
          </div>

          {/* إشكالات المدعي */}
          <div className="p-4 bg-red-50 rounded-lg">
            <h3 className="font-semibold mb-2">👥 إشكالات المدعي</h3>
            <p>{session.initial_issues}</p>
          </div>

          {/* رد المحامي */}
          <div>
            <h3 className="font-semibold mb-2">💬 ردك كمحامي</h3>
            <textarea
              value={lawyerResponse}
              onChange={(e) => setLawyerResponse(e.target.value)}
              className="w-full p-3 border rounded-lg h-32"
              placeholder="اكتب ردك على الإشكالات المطروحة..."
            />
            <button onClick={submitResponse} 
              className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg">
              📤 إرسال الرد
            </button>
          </div>

          {/* ردود الفعل */}
          {feedback && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="font-semibold">⚖️ ملاحظات القاضي</h3>
                <p>{feedback.judge_feedback}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="font-semibold">👥 رد المدعي</h3>
                <p>{feedback.litigant_counter}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourtSimulationTab;