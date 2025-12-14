#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
سكريبت لطباعة هيكل المشروع بشكل واضح ومنظم
"""

import os
from pathlib import Path
from typing import Set, List

# الفولدرات والملفات المستبعدة من العرض
EXCLUDED_DIRS = {
    '__pycache__',
    '.git',
    'node_modules',
    '.next',
    'venv',
    'env',
    '.env',
    '.venv',
    'dist',
    'build',
    '.pytest_cache',
    '.mypy_cache',
    'htmlcov',
    '.coverage',
    'eggs',
    '.eggs',
    '*.egg-info',
}

EXCLUDED_FILES = {
    '.pyc',
    '.pyo',
    '.pyd',
    '.so',
    '.dll',
    '.class',
    '.DS_Store',
    'Thumbs.db',
    '.gitignore',
    '.env.local',
    '.env.production',
}

def should_exclude(path: Path) -> bool:
    """تحديد ما إذا كان يجب استبعاد المسار"""
    # استبعاد الفولدرات
    if path.is_dir() and path.name in EXCLUDED_DIRS:
        return True
    
    # استبعاد الملفات حسب الامتداد
    if path.is_file():
        if any(path.name.endswith(ext) for ext in EXCLUDED_FILES):
            return True
        if path.suffix in {'.pyc', '.pyo', '.pyd'}:
            return True
    
    return False

def get_tree_structure(
    directory: Path,
    prefix: str = "",
    is_last: bool = True,
    max_depth: int = 10,
    current_depth: int = 0
) -> List[str]:
    """
    إنشاء هيكل شجري للمشروع
    
    Args:
        directory: المسار المراد عرضه
        prefix: البادئة للسطر الحالي
        is_last: هل هو آخر عنصر في المستوى
        max_depth: أقصى عمق للعرض
        current_depth: العمق الحالي
    """
    lines = []
    
    if current_depth > max_depth:
        return lines
    
    # رمز الاتصال
    connector = "└── " if is_last else "├── "
    
    # طباعة المجلد الحالي
    if current_depth == 0:
        lines.append(f"📦 {directory.name}/")
    else:
        icon = "📁" if directory.is_dir() else "📄"
        lines.append(f"{prefix}{connector}{icon} {directory.name}")
    
    if not directory.is_dir():
        return lines
    
    # تحضير القائمة للعناصر الفرعية
    try:
        items = sorted(directory.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
    except PermissionError:
        return lines
    
    # تصفية العناصر المستبعدة
    items = [item for item in items if not should_exclude(item)]
    
    # معالجة كل عنصر
    for index, item in enumerate(items):
        is_last_item = (index == len(items) - 1)
        
        # تحديد البادئة للمستوى التالي
        if current_depth == 0:
            extension = ""
        else:
            extension = "    " if is_last else "│   "
        
        new_prefix = prefix + extension
        
        # استدعاء تكراري
        lines.extend(
            get_tree_structure(
                item,
                new_prefix,
                is_last_item,
                max_depth,
                current_depth + 1
            )
        )
    
    return lines

def print_backend_structure():
    """طباعة هيكل Backend"""
    print("\n" + "="*70)
    print("  🔧 BACKEND STRUCTURE")
    print("="*70 + "\n")
    
    backend_path = Path("backend")
    if not backend_path.exists():
        print("❌ مجلد backend غير موجود!")
        return
    
    structure = get_tree_structure(backend_path, max_depth=4)
    for line in structure:
        print(line)

def print_frontend_structure():
    """طباعة هيكل Frontend"""
    print("\n" + "="*70)
    print("  ⚛️  FRONTEND STRUCTURE")
    print("="*70 + "\n")
    
    frontend_path = Path("frontend")
    if not frontend_path.exists():
        print("❌ مجلد frontend غير موجود!")
        return
    
    structure = get_tree_structure(frontend_path, max_depth=3)
    for line in structure:
        print(line)

def print_summary(directory: Path):
    """طباعة ملخص إحصائي"""
    print("\n" + "="*70)
    print("  📊 PROJECT SUMMARY")
    print("="*70)
    
    py_files = list(directory.rglob("*.py"))
    py_files = [f for f in py_files if not should_exclude(f)]
    
    ts_files = list(directory.rglob("*.ts")) + list(directory.rglob("*.tsx"))
    ts_files = [f for f in ts_files if not should_exclude(f)]
    
    print(f"\n  🐍 Python Files: {len(py_files)}")
    print(f"  ⚛️  TypeScript Files: {len(ts_files)}")
    
    # عد الفولدرات الرئيسية
    if (directory / "backend" / "app").exists():
        backend_folders = [d for d in (directory / "backend" / "app").iterdir() if d.is_dir() and not should_exclude(d)]
        print(f"  📁 Backend Modules: {len(backend_folders)}")
    
    if (directory / "frontend" / "components").exists():
        frontend_components = list((directory / "frontend" / "components").rglob("*.tsx"))
        frontend_components = [f for f in frontend_components if not should_exclude(f)]
        print(f"  🧩 React Components: {len(frontend_components)}")
    
    print("\n" + "="*70)

def main():
    """الدالة الرئيسية"""
    print("\n")
    print("="*70)
    print("  🚀 LEGAL PLATFORM - PROJECT STRUCTURE")
    print("="*70)
    
    # الحصول على المسار الجذري للمشروع
    project_root = Path.cwd()
    
    # إذا كنا في مجلد scripts، نرجع للجذر
    if project_root.name == "scripts":
        project_root = project_root.parent.parent
    elif project_root.name == "backend":
        project_root = project_root.parent
    
    print(f"\n📍 Project Root: {project_root.absolute()}\n")
    
    # طباعة Backend
    os.chdir(project_root)
    print_backend_structure()
    
    # طباعة Frontend
    print_frontend_structure()
    
    # طباعة الملخص
    print_summary(project_root)
    
    print("\n✅ تم إنشاء هيكل المشروع بنجاح!\n")

if __name__ == "__main__":
    main()