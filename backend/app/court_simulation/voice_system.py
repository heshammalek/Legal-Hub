# backend/app/court_simulation/voice_system.py
from typing import Dict
import speech_recognition as sr
from gtts import gTTS
import pygame
import io
import asyncio

class VoiceSystem:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
    async def speech_to_text(self) -> str:
        """تحويل الكلام إلى نص"""
        try:
            with self.microphone as source:
                print("🎤 جاري الاستماع...")
                audio = self.recognizer.listen(source, timeout=10)
                
            text = self.recognizer.recognize_google(audio, language="ar-AR")
            return text
        except sr.WaitTimeoutError:
            return "انتهى وقت الاستماع"
        except sr.UnknownValueError:
            return "لم يتم التعرف على الكلام"
    
    async def text_to_speech(self, text: str, character: Dict, emotion: str = "neutral"):
        """تحويل النص إلى كلام مع محاكاة الشخصية"""
        # تعديل النص بناءً على شخصية المتحدث
        character_text = self._apply_character_style(text, character, emotion)
        
        # توليد الصوت
        tts = gTTS(text=character_text, lang='ar', slow=False)
        audio_file = io.BytesIO()
        tts.write_to_fp(audio_file)
        audio_file.seek(0)
        
        # تشغيل الصوت
        pygame.mixer.init()
        pygame.mixer.music.load(audio_file)
        pygame.mixer.music.play()
        
        while pygame.mixer.music.get_busy():
            await asyncio.sleep(0.1)
    
    def _apply_character_style(self, text: str, character: Dict, emotion: str) -> str:
        """تطبيق أسلوب الشخصية على النص"""
        style_modifiers = {
            "aggressive": lambda t: f"بصوت عالٍ وحاد: {t}",
            "calm": lambda t: f"بهدوء وثقة: {t}", 
            "nervous": lambda t: f"بتوتر وتلعثم: {t}",
            "arrogant": lambda t: f"بتعالي واستعلاء: {t}"
        }
        
        modifier = style_modifiers.get(character.get("voice_profile", "calm"))
        return modifier(text) if modifier else text