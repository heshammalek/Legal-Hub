// src/components/dashboard/AdminDashboard.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { apiService } from '../../lib/api'

interface AdminDashboardProps {
  onBack: () => void
  adminName: string
  institution: string
  adminId?: number
}

interface Teacher {
  id: number
  name: string
  email: string
  specialization: string
  country: string
  institution_code: string
  admin_id: number
  is_active: boolean
  created_at: string
  groups_count?: number
}

interface Student {
  id: number
  name: string
  email: string
  student_id: string
  country: string
  institution_code: string
  group_id: number
  admin_id: number
  is_active: boolean
  created_at: string
  group_name?: string
}

interface StudyGroup {
  id: number
  name: string
  description: string
  country: string
  institution_code: string
  admin_id: number
  teacher_id: number
  is_active: boolean
  created_at: string
  teacher_name?: string
  students_count?: number
}

interface InstitutionStats {
  teachers_count: number
  students_count: number
  groups_count: number
  active_cases: number
  total_simulations: number
  ai_usage_count: number
}

export default function AdminDashboard({ onBack, adminName, institution, adminId = 1 }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'teachers' | 'students' | 'groups'>('overview')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [stats, setStats] = useState<InstitutionStats>({
    teachers_count: 0,
    students_count: 0,
    groups_count: 0,
    active_cases: 0,
    total_simulations: 0,
    ai_usage_count: 0
  })
  const [loading, setLoading] = useState(true)
  
  // حالات البحث والتصفية
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  
  // حالات النماذج
  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [editingItem, setEditingItem] = useState<{type: string, data: any} | null>(null)

  // بيانات النماذج
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    specialization: 'القانون الجنائي',
    country: 'SA',
    institution_code: institution,
    admin_id: adminId,
    password: '123456'
  })

  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    student_id: '',
    country: 'SA',
    institution_code: institution,
    group_id: '',
    admin_id: adminId,
    password: '123456'
  })

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    country: 'SA',
    institution_code: institution,
    admin_id: adminId,
    teacher_id: ''
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  // 🔄 دالة تحميل البيانات من API الحقيقي
 const loadDashboardData = async () => {
  setLoading(true)
  try {
    // تحميل البيانات الحقيقية من API
    const [teachersData, studentsData, groupsData] = await Promise.all([
      apiService.getTeachers(),
      apiService.getStudents(),
      apiService.getGroups()
    ])

    // 🔴 🔴 🔴 أضف هذا التحقق 🔴 🔴 🔴
    console.log('🔍 البيانات القادمة من API:');
    console.log('المجموعات:', groupsData);
    console.log('عدد المجموعات:', groupsData.length);
    console.log('المدرسين:', teachersData);
    console.log('الطلاب:', studentsData);
    // 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴 🔴

    // معالجة البيانات لتتناسب مع الداتابيز
    const processedTeachers = teachersData.map((teacher: any) => ({
      ...teacher,
      groups_count: teacher.groups_count || 0
    }))

    const processedStudents = studentsData.map((student: any) => ({
      ...student,
      group_name: student.group_name || 'غير معين'
    }))

    const processedGroups = groupsData.map((group: any) => ({
      ...group,
      students_count: group.students_count || 0,
      teacher_name: group.teacher_name || 'غير معين'
    }))

    // 🔴 تأكد من البيانات قبل التحديث
    console.log('✅ البيانات بعد المعالجة:');
    console.log('المجموعات المعالجة:', processedGroups);
    console.log('عدد المجموعات المعالجة:', processedGroups.length);

    setTeachers(processedTeachers)
    setStudents(processedStudents)
    setGroups(processedGroups)
    
    // تحديث الإحصائيات
    setStats({
      teachers_count: processedTeachers.length,
      students_count: processedStudents.length, 
      groups_count: processedGroups.length,
      active_cases: 0,
      total_simulations: 0,
      ai_usage_count: 0
    })

  } catch (error) {
    console.error('❌ Error loading dashboard data:', error)
    setStats({
      teachers_count: 4,
      students_count: 1,
      groups_count: 4,
      active_cases: 0,
      total_simulations: 0,
      ai_usage_count: 0
    })
  } finally {
    setLoading(false)
  }
}
  // 🔍 دوال البحث والتصفية
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && teacher.is_active) ||
                         (filterActive === 'inactive' && !teacher.is_active)
    
    return matchesSearch && matchesFilter
  })

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_id.includes(searchTerm)
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && student.is_active) ||
                         (filterActive === 'inactive' && !student.is_active)
    
    return matchesSearch && matchesFilter
  })

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && group.is_active) ||
                         (filterActive === 'inactive' && !group.is_active)
    
    return matchesSearch && matchesFilter
  })

  // 📊 دوال التصدير والطباعة
  const exportToExcel = (data: any[], reportName: string) => {
    try {
      // محاكاة التصدير لـ Excel/CSV
      const headers = Object.keys(data[0] || {}).join(',')
      const csvContent = data.map(item => 
        Object.values(item).map(value => `"${value}"`).join(',')
      ).join('\n')
      
      const fullCSV = headers + '\n' + csvContent
      const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `${reportName}_${new Date().toISOString().split('T')[0]}.csv`)
      link.click()
      
      alert(`✅ تم تصدير ${data.length} سجل إلى ملف Excel`)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('❌ حدث خطأ في التصدير')
    }
  }

  const printReport = (type: string) => {
    const printContent = {
      teachers: filteredTeachers,
      students: filteredStudents,
      groups: filteredGroups
    }[type]

    if (!printContent || printContent.length === 0) {
      alert('❌ لا توجد بيانات للطباعة')
      return
    }

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const title = {
        teachers: 'تقرير المدرسين',
        students: 'تقرير الطلاب', 
        groups: 'تقرير المجموعات'
      }[type]

      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
              th { background-color: #f5f5f5; }
              .footer { margin-top: 30px; text-align: left; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${title}</h1>
              <p>المؤسسة: ${institution} | التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
            <table>
              <thead>
                <tr>
                  ${Object.keys(printContent[0]).map(key => `<th>${key}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${printContent.map(item => `
                  <tr>
                    ${Object.values(item).map(value => `<td>${value}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>تم الإنشاء بواسطة: ${adminName}</p>
              <p>إجمالي السجلات: ${printContent.length}</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // ➕ دوال الإضافة - متصلة بالداتابيز الحقيقي
  const createTeacher = async () => {
    try {
      const createdTeacher = await apiService.createTeacher(newTeacher)
      setTeachers(prev => [...prev, createdTeacher])
      setStats(prev => ({ ...prev, teachers_count: prev.teachers_count + 1 }))
      setShowAddTeacher(false)
      setNewTeacher({ 
        name: '', 
        email: '', 
        specialization: 'القانون الجنائي',
        country: 'SA',
        institution_code: institution,
        admin_id: adminId,
        password: '123456'
      })
      alert('✅ تم إضافة المدرس بنجاح')
    } catch (error) {
      console.error('Error creating teacher:', error)
      alert('❌ حدث خطأ في إضافة المدرس')
    }
  }

  const createStudent = async () => {
    try {
      const createdStudent = await apiService.createStudent(newStudent)
      setStudents(prev => [...prev, createdStudent])
      setStats(prev => ({ ...prev, students_count: prev.students_count + 1 }))
      setShowAddStudent(false)
      setNewStudent({ 
        name: '', 
        email: '', 
        student_id: '',
        country: 'SA',
        institution_code: institution,
        group_id: '',
        admin_id: adminId,
        password: '123456'
      })
      alert('✅ تم إضافة الطالب بنجاح')
    } catch (error) {
      console.error('Error creating student:', error)
      alert('❌ حدث خطأ في إضافة الطالب')
    }
  }

  const createGroup = async () => {
    try {
      const createdGroup = await apiService.createGroup(newGroup)
      setGroups(prev => [...prev, createdGroup])
      setStats(prev => ({ ...prev, groups_count: prev.groups_count + 1 }))
      setShowAddGroup(false)
      setNewGroup({ 
        name: '', 
        description: '',
        country: 'SA',
        institution_code: institution,
        admin_id: adminId,
        teacher_id: ''
      })
      alert('✅ تم إنشاء المجموعة بنجاح')
    } catch (error) {
      console.error('Error creating group:', error)
      alert('❌ حدث خطأ في إنشاء المجموعة')
    }
  }

  // ✏️ دوال التعديل - متصلة بالداتابيز الحقيقي
  const updateTeacher = async (teacher: Teacher) => {
    try {
      const updatedTeacher = await apiService.updateTeacher(teacher.id, teacher)
      setTeachers(prev => prev.map(t => t.id === teacher.id ? updatedTeacher : t))
      setEditingItem(null)
      alert('✅ تم تعديل بيانات المدرس بنجاح')
    } catch (error) {
      console.error('Error updating teacher:', error)
      alert('❌ حدث خطأ في تعديل المدرس')
    }
  }

  const updateStudent = async (student: Student) => {
    try {
      const updatedStudent = await apiService.updateStudent(student.id, student)
      setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s))
      setEditingItem(null)
      alert('✅ تم تعديل بيانات الطالب بنجاح')
    } catch (error) {
      console.error('Error updating student:', error)
      alert('❌ حدث خطأ في تعديل الطالب')
    }
  }

const updateGroup = async (group: StudyGroup) => {
  try {
    // إرسال البيانات الأساسية فقط
    const updateData = {
      name: group.name,
      description: group.description,
      teacher_id: group.teacher_id
    };

    const updatedGroup = await apiService.updateGroup(group.id, updateData);
    setGroups(prev => prev.map(g => g.id === group.id ? updatedGroup : g));
    setEditingItem(null);
    alert('✅ تم تعديل بيانات المجموعة بنجاح');
  } catch (error) {
    console.error('Error updating group:', error);
    alert('❌ حدث خطأ في تعديل المجموعة');
  }
}

  // 🗑️ دوال الحذف - متصلة بالداتابيز الحقيقي
  const deleteTeacher = async (teacherId: number) => {
    if (confirm('⚠️ هل أنت متأكد من حذف هذا المدرس؟')) {
      try {
        await apiService.deleteTeacher(teacherId)
        setTeachers(prev => prev.filter(t => t.id !== teacherId))
        setStats(prev => ({ ...prev, teachers_count: prev.teachers_count - 1 }))
        alert('✅ تم حذف المدرس بنجاح')
      } catch (error) {
        console.error('Error deleting teacher:', error)
        alert('❌ حدث خطأ في حذف المدرس')
      }
    }
  }

  const deleteStudent = async (studentId: number) => {
    if (confirm('⚠️ هل أنت متأكد من حذف هذا الطالب؟')) {
      try {
        await apiService.deleteStudent(studentId)
        setStudents(prev => prev.filter(s => s.id !== studentId))
        setStats(prev => ({ ...prev, students_count: prev.students_count - 1 }))
        alert('✅ تم حذف الطالب بنجاح')
      } catch (error) {
        console.error('Error deleting student:', error)
        alert('❌ حدث خطأ في حذف الطالب')
      }
    }
  }

const deleteGroup = async (groupId: number) => {
  const group = groups.find(g => g.id === groupId);
  
  if (confirm(`⚠️ هل أنت متأكد من ${group?.is_active ? 'تعطيل' : 'حذف'} مجموعة "${group?.name}"؟`)) {
    try {
      // في الباك إند الحذف = تعطيل
      await apiService.deleteGroup(groupId);
      
      // تحديث الحالة محلياً
      setGroups(prev => prev.map(g => 
        g.id === groupId ? { ...g, is_active: false } : g
      ));
      
      alert('✅ تم تعطيل المجموعة بنجاح');
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('❌ حدث خطأ في تعطيل المجموعة');
    }
  }
}

  // 🔄 دوال التفعيل/التعطيل
  const toggleTeacherStatus = async (teacherId: number) => {
    try {
      const teacher = teachers.find(t => t.id === teacherId)
      if (teacher) {
        const updatedTeacher = await apiService.updateTeacher(teacherId, {
          ...teacher,
          is_active: !teacher.is_active
        })
        setTeachers(prev => prev.map(t => t.id === teacherId ? updatedTeacher : t))
        alert(`✅ تم ${teacher.is_active ? 'تعطيل' : 'تفعيل'} المدرس بنجاح`)
      }
    } catch (error) {
      console.error('Error toggling teacher status:', error)
      alert('❌ حدث خطأ في تغيير حالة المدرس')
    }
  }

  const toggleStudentStatus = async (studentId: number) => {
    try {
      const student = students.find(s => s.id === studentId)
      if (student) {
        const updatedStudent = await apiService.updateStudent(studentId, {
          ...student,
          is_active: !student.is_active
        })
        setStudents(prev => prev.map(s => s.id === studentId ? updatedStudent : s))
        alert(`✅ تم ${student.is_active ? 'تعطيل' : 'تفعيل'} الطالب بنجاح`)
      }
    } catch (error) {
      console.error('Error toggling student status:', error)
      alert('❌ حدث خطأ في تغيير حالة الطالب')
    }
  }

 const toggleGroupStatus = async (groupId: number) => {
  try {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      // إرسال فقط الحقل المطلوب للتعديل
      const updatedGroup = await apiService.updateGroup(groupId, {
        is_active: !group.is_active
      });
      setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
      alert(`✅ تم ${group.is_active ? 'تعطيل' : 'تفعيل'} المجموعة بنجاح`);
    }
  } catch (error) {
    console.error('Error toggling group status:', error);
    alert('❌ حدث خطأ في تغيير حالة المجموعة');
  }
}

  // دوال المساعدة
  const getActiveTeachers = () => teachers.filter(t => t.is_active)
  const getActiveGroups = () => groups.filter(g => g.is_active)

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* شريط التحكم */}
      <div className="fixed top-0 left-0 right-0 bg-slate-800/90 backdrop-blur-lg z-50 p-4 border-b border-purple-400/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2">
              ← العودة
            </button>
            <div className="h-6 w-px bg-white/20"></div>
            <div className="text-white">
              <span className="text-purple-400">مدير النظام:</span> {adminName}
            </div>
            <div className="text-white">
              <span className="text-purple-400">المؤسسة:</span> {institution}
            </div>
          </div>
          
          <div className="flex gap-2">
            {(['overview', 'teachers', 'students', 'groups'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {tab === 'overview' && '📊 نظرة عامة'}
                {tab === 'teachers' && '👨‍🏫 المدرسين'}
                {tab === 'students' && '👥 الطلاب'}
                {tab === 'groups' && '🎯 المجموعات'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="pt-20 p-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white/60">جاري تحميل البيانات...</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview-tab" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="text-3xl font-bold text-purple-400 mb-8">📊 نظرة عامة على النظام</h2>
                
                {/* الإحصائيات */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">{stats.teachers_count}</div>
                    <div className="text-white/70 text-sm">المدرسين</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">{stats.students_count}</div>
                    <div className="text-white/70 text-sm">الطلاب</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                    <div className="text-2xl font-bold text-yellow-400 mb-1">{stats.groups_count}</div>
                    <div className="text-white/70 text-sm">المجموعات</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                    <div className="text-2xl font-bold text-red-400 mb-1">{stats.active_cases}</div>
                    <div className="text-white/70 text-sm">قضايا نشطة</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-1">{stats.total_simulations}</div>
                    <div className="text-white/70 text-sm">محاكاة</div>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center">
                    <div className="text-2xl font-bold text-cyan-400 mb-1">{stats.ai_usage_count}</div>
                    <div className="text-white/70 text-sm">استخدام ذكاء</div>
                  </div>
                </div>

                {/* النشاط الحديث والإجراءات السريعة */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">📈 النشاط الحديث</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <div>
                          <div className="text-white font-medium">تم إنشاء مجموعة جديدة</div>
                          <div className="text-white/60 text-sm">المجموعة الدستورية المتقدمة</div>
                        </div>
                        <div className="text-white/40 text-sm">منذ ٢ ساعة</div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                        <div>
                          <div className="text-white font-medium">تسجيل مدرس جديد</div>
                          <div className="text-white/60 text-sm">د. محمد عبد الرحمن</div>
                        </div>
                        <div className="text-white/40 text-sm">منذ ٥ ساعات</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">🚀 إجراءات سريعة</h3>
                    <div className="space-y-3">
                      <button onClick={() => setActiveTab('teachers')} className="w-full p-4 bg-purple-500/20 text-purple-400 rounded-xl hover:bg-purple-500/30 transition-colors text-left flex items-center gap-3">
                        <span className="text-lg">👨‍🏫</span>
                        <div>
                          <div className="font-semibold">إضافة مدرس جديد</div>
                          <div className="text-purple-300/70 text-sm">إنشاء حساب لمدرس جديد</div>
                        </div>
                      </button>
                      <button onClick={() => setActiveTab('students')} className="w-full p-4 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors text-left flex items-center gap-3">
                        <span className="text-lg">👥</span>
                        <div>
                          <div className="font-semibold">تسجيل طلاب جدد</div>
                          <div className="text-blue-300/70 text-sm">إضافة طلاب للمؤسسة</div>
                        </div>
                      </button>
                      <button onClick={() => setActiveTab('groups')} className="w-full p-4 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors text-left flex items-center gap-3">
                        <span className="text-lg">🎯</span>
                        <div>
                          <div className="font-semibold">إنشاء مجموعة جديدة</div>
                          <div className="text-green-300/70 text-sm">تجميع طلاب تحت مدرس</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'teachers' && (
              <motion.div key="teachers-tab" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-purple-400">👨‍🏫 إدارة المدرسين</h2>
                  <button onClick={() => setShowAddTeacher(true)} className="bg-purple-500 text-white px-6 py-3 rounded-xl hover:bg-purple-600 transition-colors">
                    ➕ إضافة مدرس
                  </button>
                </div>

                {/* شريط البحث والتصفية */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="🔍 ابحث عن مدرس، تخصص، أو بريد إلكتروني..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                  <select
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value as any)}
                    className="p-3 rounded-xl bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="all">👥 الكل</option>
                    <option value="active">🟢 نشط فقط</option>
                    <option value="inactive">🔴 معطل فقط</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => exportToExcel(filteredTeachers, 'المدرسين')} className="bg-green-500 text-white px-4 py-3 rounded-xl hover:bg-green-600 transition-colors">
                      📊 تصدير Excel
                    </button>
                    <button onClick={() => printReport('teachers')} className="bg-blue-500 text-white px-4 py-3 rounded-xl hover:bg-blue-600 transition-colors">
                      🖨️ طباعة التقرير
                    </button>
                  </div>
                </div>

                {/* جدول المدرسين */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-right p-4 text-white/80">المدرس</th>
                          <th className="text-right p-4 text-white/80">التخصص</th>
                          <th className="text-right p-4 text-white/80">البلد</th>
                          <th className="text-right p-4 text-white/80">المجموعات</th>
                          <th className="text-right p-4 text-white/80">الحالة</th>
                          <th className="text-right p-4 text-white/80">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTeachers.map(teacher => (
                          <tr key={teacher.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-4">
                              <div className="text-white font-semibold">{teacher.name}</div>
                              <div className="text-white/60 text-sm">{teacher.email}</div>
                            </td>
                            <td className="p-4 text-white/80">{teacher.specialization}</td>
                            <td className="p-4 text-white/80">{teacher.country}</td>
                            <td className="p-4 text-white/80">{teacher.groups_count || 0} مجموعة</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs ${
                                teacher.is_active 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {teacher.is_active ? 'نشط' : 'معطل'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <button onClick={() => setEditingItem({ type: 'teacher', data: teacher })} className="text-blue-400 hover:text-blue-300 text-sm">
                                  تعديل
                                </button>
                                <button onClick={() => toggleTeacherStatus(teacher.id)} className={`text-sm ${
                                  teacher.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                                }`}>
                                  {teacher.is_active ? 'تعطيل' : 'تفعيل'}
                                </button>
                                <button onClick={() => deleteTeacher(teacher.id)} className="text-red-400 hover:text-red-300 text-sm">
                                  حذف
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* مودال إضافة مدرس */}
                {showAddTeacher && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
                      <h3 className="text-xl font-bold text-purple-400 mb-4">إضافة مدرس جديد</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/80 mb-2">اسم المدرس</label>
                          <input type="text" value={newTeacher.name} onChange={(e) => setNewTeacher(prev => ({ ...prev, name: e.target.value }))} className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white" placeholder="أدخل اسم المدرس" />
                        </div>
                        <div>
                          <label className="block text-white/80 mb-2">البريد الإلكتروني</label>
                          <input type="email" value={newTeacher.email} onChange={(e) => setNewTeacher(prev => ({ ...prev, email: e.target.value }))} className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white" placeholder="email@institution.edu" />
                        </div>
                        <div>
                          <label className="block text-white/80 mb-2">التخصص</label>
                          <select value={newTeacher.specialization} onChange={(e) => setNewTeacher(prev => ({ ...prev, specialization: e.target.value }))} className="w-full p-3 rounded-lg bg-slate-700 border border-white/20 text-white focus:border-purple-400 focus:outline-none hover:bg-slate-600 transition-colors">
                            <option value="القانون الجنائي" className="bg-slate-700">القانون الجنائي</option>
                            <option value="القانون المدني" className="bg-slate-700">القانون المدني</option>
                            <option value="القانون التجاري" className="bg-slate-700">القانون التجاري</option>
                            <option value="القانون الدستوري" className="bg-slate-700">القانون الدستوري</option>
                            <option value="القانون الدولي" className="bg-slate-700">القانون الدولي</option>
                            <option value="قانون العمل" className="bg-slate-700">قانون العمل</option>
                            <option value="القانون الإداري" className="bg-slate-700">القانون الإداري</option>
                            <option value="القانون المالي" className="bg-slate-700">القانون المالي</option>
                            <option value="القانون البحري" className="bg-slate-700">القانون البحري</option>
                            <option value="قانون الملكية الفكرية" className="bg-slate-700">قانون الملكية الفكرية</option>
                            <option value="القانون البيئي" className="bg-slate-700">القانون البيئي</option>
                            <option value="قانون الأسرة" className="bg-slate-700">قانون الأسرة</option>
                            <option value="القانون الضريبي" className="bg-slate-700">القانون الضريبي</option>
                            <option value="القانون العقاري" className="bg-slate-700">القانون العقاري</option>
                            <option value="تخصص عام" className="bg-slate-700">تخصص عام</option>
                          </select>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button onClick={() => setShowAddTeacher(false)} className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/15 transition-colors">إلغاء</button>
                          <button onClick={createTeacher} disabled={!newTeacher.name || !newTeacher.email} className="flex-1 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors">إضافة المدرس</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* مودال تعديل مدرس */}
                {editingItem?.type === 'teacher' && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
                      <h3 className="text-xl font-bold text-purple-400 mb-4">تعديل بيانات المدرس</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/80 mb-2">اسم المدرس</label>
                          <input type="text" value={editingItem.data.name} onChange={(e) => setEditingItem(prev => prev ? { ...prev, data: { ...prev.data, name: e.target.value } } : null)} className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white" />
                        </div>
                        <div>
                          <label className="block text-white/80 mb-2">البريد الإلكتروني</label>
                          <input type="email" value={editingItem.data.email} onChange={(e) => setEditingItem(prev => prev ? { ...prev, data: { ...prev.data, email: e.target.value } } : null)} className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white" />
                        </div>
                        <div>
                          <label className="block text-white/80 mb-2">التخصص</label>
                          <select value={editingItem.data.specialization} onChange={(e) => setEditingItem(prev => prev ? { ...prev, data: { ...prev.data, specialization: e.target.value } } : null)} className="w-full p-3 rounded-lg bg-slate-700 border border-white/20 text-white focus:border-purple-400 focus:outline-none hover:bg-slate-600 transition-colors">
                            <option value="القانون الجنائي" className="bg-slate-700">القانون الجنائي</option>
                            <option value="القانون المدني" className="bg-slate-700">القانون المدني</option>
                            <option value="القانون التجاري" className="bg-slate-700">القانون التجاري</option>
                            <option value="القانون الدستوري" className="bg-slate-700">القانون الدستوري</option>
                            <option value="القانون الدولي" className="bg-slate-700">القانون الدولي</option>
                            <option value="قانون العمل" className="bg-slate-700">قانون العمل</option>
                            <option value="القانون الإداري" className="bg-slate-700">القانون الإداري</option>
                            <option value="القانون المالي" className="bg-slate-700">القانون المالي</option>
                            <option value="القانون البحري" className="bg-slate-700">القانون البحري</option>
                            <option value="قانون الملكية الفكرية" className="bg-slate-700">قانون الملكية الفكرية</option>
                            <option value="القانون البيئي" className="bg-slate-700">القانون البيئي</option>
                            <option value="قانون الأسرة" className="bg-slate-700">قانون الأسرة</option>
                            <option value="القانون الضريبي" className="bg-slate-700">القانون الضريبي</option>
                            <option value="القانون العقاري" className="bg-slate-700">القانون العقاري</option>
                            <option value="تخصص عام" className="bg-slate-700">تخصص عام</option>
                          </select>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button onClick={() => setEditingItem(null)} className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/15 transition-colors">إلغاء</button>
                          <button onClick={() => updateTeacher(editingItem.data)} className="flex-1 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">حفظ التعديلات</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* تبويب الطلاب */}
            {activeTab === 'students' && (
              <motion.div key="students-tab" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-blue-400">👥 إدارة الطلاب</h2>
                  <button onClick={() => setShowAddStudent(true)} className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors">
                    ➕ إضافة طالب
                  </button>
                </div>

                {/* شريط البحث والتصفية */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="🔍 ابحث عن طالب، رقم جامعي، أو بريد إلكتروني..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  <select
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value as any)}
                    className="p-3 rounded-xl bg-white/10 border border-white/20 text-white focus:border-blue-400 focus:outline-none"
                  >
                    <option value="all">👥 الكل</option>
                    <option value="active">🟢 نشط فقط</option>
                    <option value="inactive">🔴 معطل فقط</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => exportToExcel(filteredStudents, 'الطلاب')} className="bg-green-500 text-white px-4 py-3 rounded-xl hover:bg-green-600 transition-colors">
                      📊 تصدير Excel
                    </button>
                    <button onClick={() => printReport('students')} className="bg-blue-500 text-white px-4 py-3 rounded-xl hover:bg-blue-600 transition-colors">
                      🖨️ طباعة التقرير
                    </button>
                  </div>
                </div>

                {/* جدول الطلاب */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-right p-4 text-white/80">الطالب</th>
                          <th className="text-right p-4 text-white/80">الرقم الجامعي</th>
                          <th className="text-right p-4 text-white/80">المجموعة</th>
                          <th className="text-right p-4 text-white/80">البلد</th>
                          <th className="text-right p-4 text-white/80">الحالة</th>
                          <th className="text-right p-4 text-white/80">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map(student => (
                          <tr key={student.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-4">
                              <div className="text-white font-semibold">{student.name}</div>
                              <div className="text-white/60 text-sm">{student.email}</div>
                            </td>
                            <td className="p-4 text-white/80">{student.student_id}</td>
                            <td className="p-4 text-white/80">{student.group_name}</td>
                            <td className="p-4 text-white/80">{student.country}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs ${
                                student.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {student.is_active ? 'نشط' : 'معطل'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <button onClick={() => setEditingItem({ type: 'student', data: student })} className="text-blue-400 hover:text-blue-300 text-sm">تعديل</button>
                                <button onClick={() => toggleStudentStatus(student.id)} className={`text-sm ${student.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}>
                                  {student.is_active ? 'تعطيل' : 'تفعيل'}
                                </button>
                                <button onClick={() => deleteStudent(student.id)} className="text-red-400 hover:text-red-300 text-sm">حذف</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* مودال إضافة طالب */}
                {showAddStudent && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
                      <h3 className="text-xl font-bold text-blue-400 mb-4">إضافة طالب جديد</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/80 mb-2">اسم الطالب</label>
                          <input type="text" value={newStudent.name} onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))} className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white" placeholder="أدخل اسم الطالب" />
                        </div>
                        <div>
                          <label className="block text-white/80 mb-2">البريد الإلكتروني</label>
                          <input type="email" value={newStudent.email} onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))} className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white" placeholder="email@institution.edu" />
                        </div>
                        <div>
                          <label className="block text-white/80 mb-2">الرقم الجامعي</label>
                          <input type="text" value={newStudent.student_id} onChange={(e) => setNewStudent(prev => ({ ...prev, student_id: e.target.value }))} className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white" placeholder="202400001" />
                        </div>
                        <div>
                          <label className="block text-white/80 mb-2">المجموعة</label>
                          <select value={newStudent.group_id} onChange={(e) => setNewStudent(prev => ({ ...prev, group_id: e.target.value }))} className="w-full p-3 rounded-lg bg-slate-700 border border-white/20 text-white focus:border-blue-400 focus:outline-none hover:bg-slate-600 transition-colors">
                            <option value="">اختر المجموعة</option>
                            {getActiveGroups().map(group => (
                              <option key={group.id} value={group.id.toString()} className="bg-slate-700">{group.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button onClick={() => setShowAddStudent(false)} className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/15 transition-colors">إلغاء</button>
                          <button onClick={createStudent} disabled={!newStudent.name || !newStudent.email || !newStudent.student_id || !newStudent.group_id} className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors">إضافة الطالب</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* مودال تعديل طالب */}
                {editingItem?.type === 'student' && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
                      <h3 className="text-xl font-bold text-blue-400 mb-4">تعديل بيانات الطالب</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/80 mb-2">اسم الطالب</label>
                          <input type="text" value={editingItem.data.name} onChange={(e) => setEditingItem(prev => prev ? { ...prev, data: { ...prev.data, name: e.target.value } } : null)} className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white" />
                        </div>
                        <div>
                          <label className="block text-white/80 mb-2">البريد الإلكتروني</label>
                          <input type="email" value={editingItem.data.email} onChange={(e) => setEditingItem(prev => prev ? { ...prev, data: { ...prev.data, email: e.target.value } } : null)} className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white" />
                        </div>
                        <div>
                          <label className="block text-white/80 mb-2">الرقم الجامعي</label>
                          <input type="text" value={editingItem.data.student_id} onChange={(e) => setEditingItem(prev => prev ? { ...prev, data: { ...prev.data, student_id: e.target.value } } : null)} className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white" />
                        </div>
                        <div>
                          <label className="block text-white/80 mb-2">المجموعة</label>
                          <select value={editingItem.data.group_id} onChange={(e) => setEditingItem(prev => prev ? { ...prev, data: { ...prev.data, group_id: parseInt(e.target.value) } } : null)} className="w-full p-3 rounded-lg bg-slate-700 border border-white/20 text-white focus:border-blue-400 focus:outline-none hover:bg-slate-600 transition-colors">
                            {getActiveGroups().map(group => (
                              <option key={group.id} value={group.id} className="bg-slate-700">{group.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button onClick={() => setEditingItem(null)} className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/15 transition-colors">إلغاء</button>
                          <button onClick={() => updateStudent(editingItem.data)} className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">حفظ التعديلات</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* تبويب المجموعات */}
            {activeTab === 'groups' && (
              <motion.div key="groups-tab" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-green-400">🎯 إدارة المجموعات</h2>
                  <button onClick={() => setShowAddGroup(true)} className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors">
                    ➕ إنشاء مجموعة
                  </button>
                </div>

                {/* شريط البحث والتصفية */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="🔍 ابحث عن مجموعة، وصف، أو مدرس..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-green-400 focus:outline-none"
                    />
                  </div>
                  <select
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value as any)}
                    className="p-3 rounded-xl bg-white/10 border border-white/20 text-white focus:border-green-400 focus:outline-none"
                  >
                    <option value="all">👥 الكل</option>
                    <option value="active">🟢 نشط فقط</option>
                    <option value="inactive">🔴 معطل فقط</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => exportToExcel(filteredGroups, 'المجموعات')} className="bg-green-500 text-white px-4 py-3 rounded-xl hover:bg-green-600 transition-colors">
                      📊 تصدير Excel
                    </button>
                    <button onClick={() => printReport('groups')} className="bg-blue-500 text-white px-4 py-3 rounded-xl hover:bg-blue-600 transition-colors">
                      🖨️ طباعة التقرير
                    </button>
                  </div>
                </div>

                {/* شبكة المجموعات */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGroups.map(group => (
                    <div key={group.id} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-green-400/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-white font-bold text-lg">{group.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${
                          group.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {group.is_active ? 'نشطة' : 'معطلة'}
                        </span>
                      </div>
                      
                      <p className="text-white/70 text-sm mb-4">{group.description}</p>
                      
                      <div className="flex justify-between items-center text-white/60 text-sm mb-4">
                        <span>المدرس: {group.teacher_name}</span>
                        <span>{group.students_count || 0} طالب</span>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => setEditingItem({ type: 'group', data: group })} className="flex-1 bg-blue-500/20 text-blue-400 py-2 rounded-lg hover:bg-blue-500/30 transition-colors text-sm">تعديل</button>
                        <button onClick={() => toggleGroupStatus(group.id)} className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                          group.is_active ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}>
                          {group.is_active ? 'تعطيل' : 'تفعيل'}
                        </button>
                        <button onClick={() => deleteGroup(group.id)} className="flex-1 bg-red-500/20 text-red-400 py-2 rounded-lg hover:bg-red-500/30 transition-colors text-sm">حذف</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* مودال إنشاء مجموعة */}
                {showAddGroup && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
                      <h3 className="text-xl font-bold text-green-400 mb-4">إنشاء مجموعة جديدة</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/80 mb-2">اسم المجموعة</label>
                          <input type="text" value={newGroup.name} onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))} className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white" placeholder="المجموعة أ - المستوى المتقدم" />
                        </div>
                        <div>
                          <label className="block text-white/80 mb-2">الوصف</label>
                          <textarea value={newGroup.description} onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))} rows={3} className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white" placeholder="وصف المجموعة وأهدافها التعليمية..." />
                        </div>
                        <div>
                          <label className="block text-white/80 mb-2">المدرس المسؤول</label>
                          <select value={newGroup.teacher_id} onChange={(e) => setNewGroup(prev => ({ ...prev, teacher_id: e.target.value }))} className="w-full p-3 rounded-lg bg-slate-700 border border-white/20 text-white focus:border-green-400 focus:outline-none hover:bg-slate-600 transition-colors">
                            <option value="">اختر المدرس</option>
                            {getActiveTeachers().map(teacher => (
                              <option key={teacher.id} value={teacher.id.toString()} className="bg-slate-700">{teacher.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button onClick={() => setShowAddGroup(false)} className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/15 transition-colors">إلغاء</button>
                          <button onClick={createGroup} disabled={!newGroup.name || !newGroup.teacher_id} className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors">إنشاء المجموعة</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* مودال تعديل مجموعة */}
                {editingItem?.type === 'group' && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
                      <h3 className="text-xl font-bold text-green-400 mb-4">تعديل بيانات المجموعة</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white/80 mb-2">اسم المجموعة</label>
                          <input type="text" value={editingItem.data.name} onChange={(e) => setEditingItem(prev => prev ? { ...prev, data: { ...prev.data, name: e.target.value } } : null)} className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white" />
                        </div>
                        <div>
                          <label className="block text-white/80 mb-2">الوصف</label>
                          <textarea value={editingItem.data.description} onChange={(e) => setEditingItem(prev => prev ? { ...prev, data: { ...prev.data, description: e.target.value } } : null)} rows={3} className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white" />
                        </div>
                        <div>
                          <label className="block text-white/80 mb-2">المدرس المسؤول</label>
                          <select value={editingItem.data.teacher_id} onChange={(e) => setEditingItem(prev => prev ? { ...prev, data: { ...prev.data, teacher_id: parseInt(e.target.value) } } : null)} className="w-full p-3 rounded-lg bg-slate-700 border border-white/20 text-white focus:border-green-400 focus:outline-none hover:bg-slate-600 transition-colors">
                            {getActiveTeachers().map(teacher => (
                              <option key={teacher.id} value={teacher.id} className="bg-slate-700">{teacher.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button onClick={() => setEditingItem(null)} className="flex-1 py-3 bg-white/10 text-white rounded-lg hover:bg-white/15 transition-colors">إلغاء</button>
                          <button onClick={() => updateGroup(editingItem.data)} className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">حفظ التعديلات</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}