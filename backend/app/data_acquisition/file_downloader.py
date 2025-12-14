# backend/app/data_acquisition/file_downloader.py
import aiohttp
import aiofiles
import os
from urllib.parse import urlparse
import asyncio
from typing import List, Optional

class FileDownloader:
    def __init__(self):
        # المسار المطلق
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.base_path = os.path.join(current_dir, "..", "..", "data", "countries")
    
    async def download_file(self, file_url: str, country: str, category: str) -> Optional[str]:
        """تحميل ملف من رابط وحفظه في المسار المناسب"""
        try:
            # استخراج اسم الملف من الرابط
            parsed_url = urlparse(file_url)
            file_name = os.path.basename(parsed_url.path)
            
            if not file_name or '.' not in file_name:
                file_name = f"document_{hash(file_url)}.pdf"
            
            # المسار النهائي للحفظ
            save_dir = os.path.join(self.base_path, country, category)
            os.makedirs(save_dir, exist_ok=True)
            save_path = os.path.join(save_dir, file_name)
            
            print(f"📥 جاري تحميل: {file_url}")
            print(f"📁 سيتم الحفظ في: {save_path}")
            
            # تحميل الملف
            async with aiohttp.ClientSession() as session:
                async with session.get(file_url) as response:
                    if response.status == 200:
                        async with aiofiles.open(save_path, 'wb') as f:
                            await f.write(await response.read())
                        
                        print(f"✅ تم تحميل: {file_name} ({os.path.getsize(save_path)} bytes)")
                        return save_path
                    else:
                        print(f"❌ فشل التحميل: {response.status}")
                        return None
                        
        except Exception as e:
            print(f"❌ خطأ في التحميل: {e}")
            import traceback
            traceback.print_exc()
            return None