// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

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

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token');
    }
    return this.token;
  }

  // في api.ts - عدل الدالة دي
async login(credentials: { country: string; institution_code: string; password: string }) {
  try {
    console.log('🔐 محاولة تسجيل الدخول:', credentials);
    
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        country: credentials.country.toUpperCase(),
        institution_code: credentials.institution_code.toUpperCase(),
        password: credentials.password
      })
    });

    console.log('📡 حالة الرد:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ خطأ من السيرفر:', errorData);
      throw new Error(errorData.detail || `فشل في تسجيل الدخول: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📦 بيانات الرد:', data);

    if (data.access_token) {
      this.setToken(data.access_token);
      console.log('✅ تم حفظ التوكن:', data.access_token.substring(0, 20) + '...');
      return data;
    }
    
    throw new Error('لا يوجد token في الاستجابة');
    
  } catch (error: any) {
    console.error('❌ خطأ في تسجيل الدخول:', error);
    throw new Error(error.message || 'حدث خطأ في الاتصال');
  }
}

  async getDashboardStats() {
    try {
      const response = await fetch(`${API_BASE}/api/admin/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('فشل في جلب الإحصائيات');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  async getTeachers(): Promise<Teacher[]> {
    try {
      const response = await fetch(`${API_BASE}/api/admin/teachers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('فشل في جلب بيانات المدرسين');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  }

  async createTeacher(teacherData: any): Promise<Teacher> {
    try {
      const response = await fetch(`${API_BASE}/api/admin/teachers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(teacherData)
      });

      if (!response.ok) {
        throw new Error('فشل في إضافة المدرس');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating teacher:', error);
      throw error;
    }
  }

  async updateTeacher(teacherId: number, teacherData: any): Promise<Teacher> {
    try {
      const response = await fetch(`${API_BASE}/api/admin/teachers/${teacherId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(teacherData)
      });

      if (!response.ok) {
        throw new Error('فشل في تعديل المدرس');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  }

  async deleteTeacher(teacherId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/api/admin/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('فشل في حذف المدرس');
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw error;
    }
  }

  async getStudents(): Promise<Student[]> {
    try {
      const response = await fetch(`${API_BASE}/api/admin/students`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('فشل في جلب بيانات الطلاب');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  async createStudent(studentData: any): Promise<Student> {
    try {
      const response = await fetch(`${API_BASE}/api/admin/students`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentData)
      });

      if (!response.ok) {
        throw new Error('فشل في إضافة الطالب');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  async updateStudent(studentId: number, studentData: any): Promise<Student> {
    try {
      const response = await fetch(`${API_BASE}/api/admin/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentData)
      });

      if (!response.ok) {
        throw new Error('فشل في تعديل الطالب');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  async deleteStudent(studentId: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/api/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('فشل في حذف الطالب');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }

  async getGroups(): Promise<StudyGroup[]> {
    try {
      const response = await fetch(`${API_BASE}/api/admin/groups`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('فشل في جلب بيانات المجموعات');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  }

  async createGroup(groupData: any): Promise<StudyGroup> {
    try {
      const response = await fetch(`${API_BASE}/api/admin/groups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(groupData)
      });

      if (!response.ok) {
        throw new Error('فشل في إنشاء المجموعة');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

async updateGroup(groupId: number, groupData: any): Promise<any> {
  const response = await fetch(`${API_BASE}/api/admin/groups/${groupId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(groupData)
  });

  if (!response.ok) {
    throw new Error('فشل في تعديل المجموعة');
  }

  return await response.json();
}

async deleteGroup(groupId: number): Promise<any> {
  const response = await fetch(`${API_BASE}/api/admin/groups/${groupId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error('فشل في حذف المجموعة');
  }

  return await response.json();
}

  async studentLogin(credentials: { student_id: string; institution_code: string }) {
    try {
      const response = await fetch(`${API_BASE}/api/auth/student-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error('فشل في تسجيل دخول الطالب');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in student login:', error);
      throw error;
    }
  }

  async teacherLogin(credentials: { email: string; institution_code: string }) {
    try {
      const response = await fetch(`${API_BASE}/api/auth/teacher-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error('فشل في تسجيل دخول المدرس');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in teacher login:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();