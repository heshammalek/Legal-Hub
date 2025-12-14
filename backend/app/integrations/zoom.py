# backend/app/integrations/zoom.py
from datetime import datetime
import requests
from app.core.config import settings

def create_zoom_meeting(topic: str, start_time: datetime, duration: int = 30):
    """
    إنشاء اجتماع Zoom حقيقي
    """
    url = "https://api.zoom.us/v2/users/me/meetings"
    headers = {
        "Authorization": f"Bearer {settings.ZOOM_JWT_TOKEN}",
        "Content-Type": "application/json"
    }
    
    data = {
        "topic": topic,
        "type": 2,  # Scheduled meeting
        "start_time": start_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "duration": duration,
        "timezone": "UTC",
        "settings": {
            "host_video": True,
            "participant_video": True,
            "join_before_host": False,
            "waiting_room": True,
            "approval_type": 0
        }
    }
    
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code == 201:
        meeting = response.json()
        return {
            "meeting_id": meeting["id"],
            "join_url": meeting["join_url"],
            "password": meeting["password"]
        }
    else:
        raise Exception(f"Failed to create Zoom meeting: {response.text}")