'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Image } from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { useEffect, useState, useRef } from 'react'
import {
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Table as TableIcon,
  FileText,
  Type,
  Palette,
  Undo,
  Redo,
  Trash2,
  Eraser
} from 'lucide-react'

interface LegalEditorProps {
  content: string
  onUpdate: (content: string) => void
  fontSize: string
  textColor: string
}

export default function LegalEditor({ 
  content, 
  onUpdate, 
  fontSize, 
  textColor
}: LegalEditorProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [currentFontFamily, setCurrentFontFamily] = useState<string>('Arial, sans-serif')
  const [currentFontSize, setCurrentFontSize] = useState<string>(fontSize)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const editor = useEditor({
    extensions: [
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          HTMLAttributes: {
            class: 'rtl-list',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'rtl-list',
          },
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Underline,
      Image.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'editor-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose-mirror-editor min-h-[500px] p-6 focus:outline-none direction-rtl text-right',
        dir: 'rtl',
        style: `font-family: ${currentFontFamily}; font-size: ${currentFontSize}px;`,
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
    immediatelyRender: false,
  })

  // وظائف التنسيق
  const setTextColor = (color: string) => {
    editor?.chain().focus().setColor(color).run()
  }

  // إصلاح مشكلة حجم الخط - تحديث مباشر للمحرر
  const handleFontSizeChange = (size: string) => {
    setCurrentFontSize(size)
    if (editor) {
      const editorElement = document.querySelector('.prose-mirror-editor')
      if (editorElement) {
        (editorElement as HTMLElement).style.fontSize = `${size}px`
      }
    }
  }

  // إصلاح مشكلة نوع الخط - تطبيق على المحرر ككل
  const handleFontFamilyChange = (font: string) => {
    setCurrentFontFamily(font)
    if (editor) {
      const editorElement = document.querySelector('.prose-mirror-editor')
      if (editorElement) {
        (editorElement as HTMLElement).style.fontFamily = font
      }
    }
  }

  // إدراج صفحة جديدة
  const addPageBreak = () => {
    editor?.chain().focus().insertContent(`
      <div style="page-break-after: always; margin: 40px 0; text-align: center; color: #999; border-top: 2px dashed #ddd; padding-top: 20px;">
        ────── صفحة جديدة ──────
      </div>
    `).run()
  }

  // إدراج جدول
  const addTable = () => {
    const rows = window.prompt('عدد الصفوف:', '3')
    const cols = window.prompt('عدد الأعمدة:', '3')
    
    if (rows && cols) {
      editor?.chain().focus().insertTable({ 
        rows: parseInt(rows), 
        cols: parseInt(cols), 
        withHeaderRow: true 
      }).run()
    }
  }

  // رفع صورة من الجهاز
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        editor?.chain().focus().setImage({ src: imageUrl }).run()
      }
      reader.readAsDataURL(file)
      // reset input
      event.target.value = ''
    }
  }

  // إزالة جميع الصور من المحرر
  const removeAllImages = () => {
    if (window.confirm('هل تريد إزالة جميع الصور من المستند؟')) {
      const currentContent = editor?.getHTML() || ''
      const contentWithoutImages = currentContent.replace(/<img[^>]*>/g, '')
      editor?.commands.setContent(contentWithoutImages)
    }
  }

  // إزالة التنسيقات
  const removeFormatting = () => {
    editor?.chain().focus().clearNodes().unsetAllMarks().run()
  }

  // تنظيف المستند بالكامل
  const cleanDocument = () => {
    if (window.confirm('هل تريد تنظيف المستند من جميع الصور والتنسيقات والتنسيقات الخاصة؟')) {
      let content = editor?.getHTML() || ''
      
      // إزالة الصور
      content = content.replace(/<img[^>]*>/g, '')
      
      // إزالة التنسيقات المحددة
      content = content.replace(/<span[^>]*>/g, '')
      content = content.replace(/<\/span>/g, '')
      content = content.replace(/style="[^"]*"/g, '')
      content = content.replace(/class="[^"]*"/g, '')
      content = content.replace(/<div[^>]*>/g, '')
      content = content.replace(/<\/div>/g, '')
      
      // الحفاظ على الهيكل الأساسي
      content = content.replace(/<h1>/g, '<h1>')
      content = content.replace(/<h2>/g, '<h2>')
      content = content.replace(/<h3>/g, '<h3>')
      content = content.replace(/<p>/g, '<p>')
      content = content.replace(/<ul>/g, '<ul>')
      content = content.replace(/<ol>/g, '<ol>')
      content = content.replace(/<li>/g, '<li>')
      content = content.replace(/<table>/g, '<table>')
      content = content.replace(/<tr>/g, '<tr>')
      content = content.replace(/<td>/g, '<td>')
      content = content.replace(/<th>/g, '<th>')
      
      editor?.commands.setContent(content)
    }
  }

  // إدراج رأس المستند
  const insertHeader = () => {
    editor?.chain().focus().insertContent(`
      <div class="document-header" style="border-bottom: 2px solid #1e40af; padding-bottom: 15px; margin-bottom: 20px; text-align: center;">
        <h1 style="color: #1e40af; margin: 0;">رأس المستند</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0;">التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
      </div>
    `).run()
  }

  // إدراج تذييل المستند
  const insertFooter = () => {
    editor?.chain().focus().insertContent(`
      <div class="document-footer" style="border-top: 2px solid #1e40af; padding-top: 15px; margin-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 0;">تذييل المستند - الصفحة 1</p>
      </div>
    `).run()
  }

  // إدراج توقيع
  const insertSignature = () => {
    editor?.chain().focus().insertContent(`
      <div class="signature-section" style="margin-top: 40px; text-align: left; direction: ltr;">
        <div style="border-top: 1px solid #000; width: 200px; margin: 20px 0 10px 0;"></div>
        <p style="margin: 0; font-size: 14px;">التوقيع: ________________</p>
        <p style="margin: 0; font-size: 12px; color: #666;">الاسم: ______________</p>
        <p style="margin: 0; font-size: 12px; color: #666;">التاريخ: ______________</p>
      </div>
    `).run()
  }

  // إدراج قائمة نقطية
  const insertBulletList = () => {
    editor?.chain().focus().toggleBulletList().run()
  }

  // إدراج قائمة رقمية
  const insertOrderedList = () => {
    editor?.chain().focus().toggleOrderedList().run()
  }

  // تراجع
  const handleUndo = () => {
    editor?.chain().focus().undo().run()
  }

  // إعادة
  const handleRedo = () => {
    editor?.chain().focus().redo().run()
  }

  // مسح التنسيق من النص المحدد
  const clearFormatting = () => {
    editor?.chain().focus().clearNodes().unsetAllMarks().run()
  }

  // التأكد من أن المحرر جاهز
  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  // تحديث حجم الخط عند التغيير
  useEffect(() => {
    if (editor) {
      handleFontSizeChange(fontSize)
    }
  }, [fontSize, editor])

  // تحديث لون النص عند التغيير
  useEffect(() => {
    if (editor) {
      setTextColor(textColor)
    }
  }, [textColor, editor])

  if (!isMounted || !editor) {
    return (
      <div className="flex flex-col h-full bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="min-h-[500px] p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">جاري تحميل المحرر القانوني...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm">
      {/* شريط أدوات التنسيق المحسن */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border-b border-gray-200">
        
        {/* Undo/Redo */}
        <div className="flex gap-1">
          <button
            onClick={handleUndo}
            className="p-2 rounded hover:bg-gray-200 text-gray-700 transition-colors"
            title="تراجع (Ctrl+Z)"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={handleRedo}
            className="p-2 rounded hover:bg-gray-200 text-gray-700 transition-colors"
            title="إعادة (Ctrl+Y)"
          >
            <Redo size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* مجموعة الخطوط - معدل */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1">
            <Type size={16} className="text-gray-500" />
            <select 
              value={currentFontFamily}
              onChange={(e) => handleFontFamilyChange(e.target.value)}
              className="text-sm bg-transparent focus:outline-none min-w-[140px]"
              title="نوع الخط"
            >
              <option value="Arial, sans-serif">Arial</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="Tahoma, sans-serif">Tahoma</option>
              <option value="'Traditional Arabic', serif">Traditional Arabic</option>
              <option value="'Cairo', sans-serif">Cairo</option>
              <option value="'Almarai', sans-serif">Almarai</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1">
            <span className="text-sm text-gray-600">حجم</span>
            <input
              type="number"
              value={currentFontSize}
              onChange={(e) => handleFontSizeChange(e.target.value)}
              min="8"
              max="72"
              className="w-16 p-1 rounded border border-gray-300 bg-white text-gray-700 text-sm text-center"
              title="حجم الخط"
            />
            <span className="text-sm text-gray-600 w-6">px</span>
          </div>

          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1">
            <Palette size={16} className="text-gray-500" />
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-6 h-6 border-0 rounded cursor-pointer bg-transparent"
              title="لون النص"
            />
          </div>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* التنسيق الأساسي */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded transition-colors ${
              editor.isActive('bold') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 text-gray-700'
            }`}
            title="عريض (Ctrl+B)"
          >
            <Bold size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded transition-colors ${
              editor.isActive('italic') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 text-gray-700'
            }`}
            title="مائل (Ctrl+I)"
          >
            <Italic size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded transition-colors ${
              editor.isActive('underline') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 text-gray-700'
            }`}
            title="تحته خط (Ctrl+U)"
          >
            <UnderlineIcon size={18} />
          </button>
          <button
            onClick={clearFormatting}
            className="p-2 rounded hover:bg-gray-200 text-gray-700 transition-colors"
            title="مسح التنسيق (Ctrl+Space)"
          >
            <Eraser size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* المحاذاة */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded transition-colors ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 text-gray-700'
            }`}
            title="محاذاة لليسار"
          >
            <AlignLeft size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded transition-colors ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 text-gray-700'
            }`}
            title="توسيط"
          >
            <AlignCenter size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded transition-colors ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 text-gray-700'
            }`}
            title="محاذاة لليمين"
          >
            <AlignRight size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded transition-colors ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 text-gray-700'
            }`}
            title="ضبط"
          >
            <AlignJustify size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* العناوين */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 text-gray-700'
            }`}
            title="عنوان رئيسي"
          >
            <Heading1 size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 text-gray-700'
            }`}
            title="عنوان فرعي"
          >
            <Heading2 size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded transition-colors ${
              editor.isActive('heading', { level: 3 }) ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 text-gray-700'
            }`}
            title="عنوان ثانوي"
          >
            <Heading3 size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* القوائم */}
        <div className="flex gap-1">
          <button
            onClick={insertBulletList}
            className={`p-2 rounded transition-colors ${
              editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 text-gray-700'
            }`}
            title="قائمة نقطية"
          >
            <List size={18} />
          </button>
          <button
            onClick={insertOrderedList}
            className={`p-2 rounded transition-colors ${
              editor.isActive('orderedList') ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 text-gray-700'
            }`}
            title="قائمة رقمية"
          >
            <ListOrdered size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* إدراج عناصر */}
        <div className="flex gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded hover:bg-gray-200 text-gray-700 transition-colors"
            title="إدراج صورة"
          >
            <ImageIcon size={18} />
          </button>
          <button
            onClick={addTable}
            className="p-2 rounded hover:bg-gray-200 text-gray-700 transition-colors"
            title="إدراج جدول"
          >
            <TableIcon size={18} />
          </button>
          <button
            onClick={addPageBreak}
            className="p-2 rounded hover:bg-gray-200 text-gray-700 transition-colors"
            title="إضافة صفحة جديدة"
          >
            <span className="text-sm">📄</span>
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* أدوات التنظيف */}
        <div className="flex gap-1">
          <button
            onClick={removeAllImages}
            className="p-2 rounded hover:bg-red-100 text-red-600 transition-colors"
            title="إزالة جميع الصور"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={removeFormatting}
            className="p-2 rounded hover:bg-yellow-100 text-yellow-600 transition-colors"
            title="إزالة التنسيقات"
          >
            <Eraser size={18} />
          </button>
          <button
            onClick={cleanDocument}
            className="p-2 rounded hover:bg-red-100 text-red-600 transition-colors"
            title="تنظيف المستند بالكامل"
          >
            <span className="text-sm font-bold">🧹</span>
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300"></div>

        {/* عناصر المستند */}
        <div className="flex gap-1">
          <button
            onClick={insertHeader}
            className="p-2 rounded hover:bg-gray-200 text-gray-700 transition-colors"
            title="إدراج رأس المستند"
          >
            <FileText size={18} />
          </button>
          <button
            onClick={insertFooter}
            className="p-2 rounded hover:bg-gray-200 text-gray-700 transition-colors"
            title="إدراج تذييل"
          >
            <span className="text-sm">📝</span>
          </button>
          <button
            onClick={insertSignature}
            className="p-2 rounded hover:bg-gray-200 text-gray-700 transition-colors"
            title="إدراج توقيع"
          >
            <span className="text-sm font-semibold">✍️</span>
          </button>
        </div>
      </div>

      {/* إدخال الملف المخفي */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* محتوى المحرر */}
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>

      {/* شريط الحالة السفلي */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>حجم الخط: {currentFontSize}px</span>
          <span>الخط: {currentFontFamily.split(',')[0].replace(/'/g, '')}</span>
          <span>لون: {textColor}</span>
          <span>الكلمات: {editor.getText().split(/\s+/).filter(word => word.length > 0).length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>⚖️ المحرر القانوني المتقدم</span>
        </div>
      </div>

      {/* إضافة CSS مخصص للتنسيقات */}
      <style jsx global>{`
        .prose-mirror-editor {
          font-size: ${currentFontSize}px;
          line-height: 1.8;
          padding: 1.5rem;
          min-height: 500px;
          color: ${textColor};
          font-family: ${currentFontFamily};
        }
        
        .prose-mirror-editor h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
          color: #1e40af;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 0.5em;
          font-family: ${currentFontFamily};
        }
        
        .prose-mirror-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
          color: #1e40af;
          font-family: ${currentFontFamily};
        }
        
        .prose-mirror-editor h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 1em 0 0.5em 0;
          color: #1e40af;
          font-family: ${currentFontFamily};
        }
        
        .prose-mirror-editor p {
          margin: 1em 0;
          text-align: justify;
          font-family: ${currentFontFamily};
        }
        
        .prose-mirror-editor ul,
        .prose-mirror-editor ol {
          margin: 1em 0;
          padding-right: 2em;
          font-family: ${currentFontFamily};
        }
        
        .prose-mirror-editor li {
          margin: 0.5em 0;
          font-family: ${currentFontFamily};
        }
        
        .prose-mirror-editor ul {
          list-style-type: disc;
        }
        
        .prose-mirror-editor ol {
          list-style-type: decimal;
        }
        
        .prose-mirror-editor strong {
          font-weight: bold;
        }
        
        .prose-mirror-editor em {
          font-style: italic;
        }
        
        .prose-mirror-editor u {
          text-decoration: underline;
        }
        
        .prose-mirror-editor table {
          width: 100%;
          border-collapse: collapse;
          margin: 1em 0;
          font-family: ${currentFontFamily};
        }
        
        .prose-mirror-editor table th,
        .prose-mirror-editor table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: right;
          font-family: ${currentFontFamily};
        }
        
        .prose-mirror-editor table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        
        .prose-mirror-editor img {
          max-width: 100%;
          height: auto;
          margin: 1em 0;
          border-radius: 4px;
        }
        
        .document-header {
          border-bottom: 2px solid #1e40af;
          padding-bottom: 15px;
          margin-bottom: 20px;
          text-align: center;
          font-family: ${currentFontFamily};
        }
        
        .document-footer {
          border-top: 2px solid #1e40af;
          padding-top: 15px;
          margin-top: 20px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          font-family: ${currentFontFamily};
        }
        
        .signature-section {
          margin-top: 40px;
          text-align: left;
          direction: ltr;
          font-family: ${currentFontFamily};
        }
        
        .ai-generated-content {
          border-right: 3px solid #10b981;
          background: #f0fdf4;
          padding: 1rem;
          margin: 1rem 0;
          border-radius: 0.5rem;
          font-family: ${currentFontFamily};
        }
        
        .ai-suggestion {
          border: 1px solid #e5e7eb;
          padding: 1rem;
          margin: 1rem 0;
          background: #f9fafb;
          border-radius: 0.5rem;
          font-family: ${currentFontFamily};
        }
        
        /* تأكد من أن المحرر يدعم RTL */
        .ProseMirror {
          text-align: right;
          direction: rtl;
          font-family: ${currentFontFamily};
          font-size: ${currentFontSize}px;
        }
        
        .ProseMirror p {
          text-align: justify;
          font-family: ${currentFontFamily};
        }
        
        .ProseMirror ul,
        .ProseMirror ol {
          padding-right: 1.5em;
          padding-left: 0;
          font-family: ${currentFontFamily};
        }
        
        .ProseMirror li {
          text-align: right;
          font-family: ${currentFontFamily};
        }
        
        .ProseMirror table {
          direction: rtl;
          font-family: ${currentFontFamily};
        }
        
        .ProseMirror th,
        .ProseMirror td {
          text-align: right;
          font-family: ${currentFontFamily};
        }

        .editor-image {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .editor-table {
          border: 1px solid #e5e7eb;
          margin: 1rem 0;
        }

        .editor-table th {
          background-color: #f8fafc;
          font-weight: 600;
        }
      `}</style>
    </div>
  )
}