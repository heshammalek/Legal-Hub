// components/delegation/DelegationPrintView.tsx
import React from 'react'

type DelegationRequest = {
  court_name: string
  circuit: string
  case_number: string
  case_date: string
  required_action: string
  registration_number: string
  power_of_attorney_number: string
  requester_name: string
  accepter_name?: string
  created_at: string
  status: string
}

export default function DelegationPrintView({ request }: { request: DelegationRequest }) {
  return (
    <div className="print-container" style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h2 style={{ textAlign: 'center' }}>طلب إنابة قضائية</h2>
      <hr />

      <section>
        <h4>بيانات القضية</h4>
        <p><strong>اسم المحكمة:</strong> {request.court_name}</p>
        <p><strong>الدائرة:</strong> {request.circuit}</p>
        <p><strong>رقم القضية:</strong> {request.case_number}</p>
        <p><strong>تاريخ الجلسة:</strong> {request.case_date}</p>
      </section>

      <section>
        <h4>الإجراء المطلوب</h4>
        <p>{request.required_action}</p>
      </section>

      <section>
        <h4>بيانات المحامين</h4>
        <p><strong>طالب الإنابة:</strong> {request.requester_name}</p>
        <p><strong>المحامي المناب:</strong> {request.accepter_name || 'لم يتم القبول بعد'}</p>
      </section>

      <section>
        <h4>تفاصيل إضافية</h4>
        <p><strong>رقم القيد:</strong> {request.registration_number}</p>
        <p><strong>رقم التوكيل:</strong> {request.power_of_attorney_number}</p>
        <p><strong>تاريخ الإنشاء:</strong> {new Date(request.created_at).toLocaleDateString()}</p>
        <p><strong>الحالة:</strong> {request.status}</p>
      </section>

      <hr />
      <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>تم إنشاء هذا الطلب عبر منصة الإنابة القضائية</p>
    </div>
  )
}
