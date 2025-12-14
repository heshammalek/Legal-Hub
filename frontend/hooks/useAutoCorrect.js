import { useState, useCallback } from 'react'

// قاموس التصحيح التلقائي للعربية
const ARABIC_CORRECTIONS = {
  'اللهم': 'اللهُم',
  'ان': 'إن',
  'انا': 'أنا',
  'انت': 'أنت',
  'هو': 'هُوَ',
  'هي': 'هِيَ',
  'هم': 'هُم',
  'الى': 'إلى',
  'انما': 'إنَّما',
  'الا': 'إلا',
  'اول': 'أول',
  'اي': 'أي',
  'ايضا': 'أيضاً',
  'ايا': 'إيا',
  'اين': 'أين',
  'هذا': 'هَذا',
  'هذه': 'هَذِهِ',
  'ذلك': 'ذَلِكَ',
  'هؤلاء': 'هَؤُلاء',
  'كان': 'كانَ',
  'يكون': 'يَكون',
  'قال': 'قالَ',
  'يقول': 'يَقول',
  'اذ': 'إذ',
  'اذا': 'إذا',
  'اذن': 'إذن',
  'اما': 'أما',
  'او': 'أو',
  'ايا': 'إيا'
}

// تصحيح الأخطاء الشائعة
const COMMON_MISTAKES = {
  'مثلا': 'مثلاً',
  'فعلا': 'فعلاً',
  'تقريبا': 'تقريباً',
  'طبعا': 'طبعاً',
  'خصوصا': 'خصوصاً',
  'عادة': 'عادةً',
  'اولا': 'أولاً',
  'ثانيا': 'ثانياً',
  'اخيرا': 'أخيراً',
  'فعلي': 'فعليّ',
  'قانوني': 'قانونيّ',
  'شرعي': 'شرعيّ'
}

// الأخطاء الإملائية الشائعة
const SPELLING_MISTAKES = {
  'اثبات': 'إثبات',
  'اثناء': 'أثناء',
  'اثر': 'أثر',
  'اجر': 'أجر',
  'احكام': 'أحكام',
  'اخرى': 'أخرى',
  'اخذ': 'أخذ',
  'اختيار': 'اختيار',
  'ادارة': 'إدارة',
  'اذن': 'إذن',
  'اراء': 'آراء',
  'استاذ': 'أستاذ',
  'اشخاص': 'أشخاص',
  'اطفال': 'أطفال',
  'اقسام': 'أقسام',
  'اموال': 'أموال',
  'انشاء': 'إنشاء',
  'اهل': 'أهل',
  'اول': 'أول',
  'ايام': 'أيام'
}

export const useAutoCorrect = () => {
  const [suggestions, setSuggestions] = useState([])
  const [isEnabled, setIsEnabled] = useState(true)

  // دالة التصحيح التلقائي
  const autoCorrect = useCallback((text) => {
    if (!isEnabled) return text

    let correctedText = text
    
    // تطبيق التصحيحات من جميع القواميس
    const allCorrections = { ...ARABIC_CORRECTIONS, ...COMMON_MISTAKES, ...SPELLING_MISTAKES }
    
    Object.entries(allCorrections).forEach(([wrong, correct]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi')
      correctedText = correctedText.replace(regex, correct)
    })

    return correctedText
  }, [isEnabled])

  // اقتراحات التصحيح
  const getSuggestions = useCallback((text) => {
    const words = text.split(/\s+/)
    const newSuggestions = []

    const allCorrections = { ...ARABIC_CORRECTIONS, ...COMMON_MISTAKES, ...SPELLING_MISTAKES }

    words.forEach((word, index) => {
      const cleanWord = word.replace(/[.,!?;:]$/, '')
      
      if (allCorrections[cleanWord.toLowerCase()]) {
        newSuggestions.push({
          index,
          word: cleanWord,
          suggestion: allCorrections[cleanWord.toLowerCase()],
          type: 'spelling'
        })
      }
    })

    setSuggestions(newSuggestions)
    return newSuggestions
  }, [])

  // تطبيق اقتراح معين
  const applySuggestion = useCallback((text, suggestion) => {
    const words = text.split(/\s+/)
    if (words[suggestion.index]) {
      words[suggestion.index] = words[suggestion.index].replace(
        suggestion.word, 
        suggestion.suggestion
      )
      return words.join(' ')
    }
    return text
  }, [])

  // تطبيق جميع الاقتراحات
  const applyAllSuggestions = useCallback((text, suggestionsList) => {
    let correctedText = text
    suggestionsList.forEach(suggestion => {
      const regex = new RegExp(`\\b${suggestion.word}\\b`, 'gi')
      correctedText = correctedText.replace(regex, suggestion.suggestion)
    })
    return correctedText
  }, [])

  return {
    autoCorrect,
    getSuggestions,
    applySuggestion,
    applyAllSuggestions,
    suggestions,
    isEnabled,
    setIsEnabled
  }
}

// كومبوننت لعرض الاقتراحات
export const SuggestionList = ({ suggestions, onApplySuggestion, onApplyAll }) => {
  if (suggestions.length === 0) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-gray-800">اقتراحات التصحيح</h4>
        {suggestions.length > 1 && (
          <button
            onClick={onApplyAll}
            className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
          >
            تطبيق الكل
          </button>
        )}
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex-1">
              <span className="text-red-500 line-through">{suggestion.word}</span>
              <span className="mx-2">→</span>
              <span className="text-green-600 font-semibold">{suggestion.suggestion}</span>
            </div>
            <button
              onClick={() => onApplySuggestion(suggestion)}
              className="text-sm bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded transition-colors"
            >
              تطبيق
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}