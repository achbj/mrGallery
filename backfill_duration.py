import asyncio
from backend.database import async_sessionmaker, engine
from backend.models import MediaItem, MediaKind
from sqlalchemy.future import select
import cv2

async def backfill():
    async with async_sessionmaker(engine, expire_on_commit=False)() as db:
        result = await db.execute(select(MediaItem).where(MediaItem.kind == MediaKind.VIDEO).where(MediaItem.duration == None))
        items = result.scalars().all()
        for item in items:
            try:
                cap = cv2.VideoCapture(item.path)
                if cap.isOpened():
                    fps = cap.get(cv2.CAP_PROP_FPS)
                    frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
                    if fps > 0 and frames > 0:
                        item.duration = frames / fps
                cap.release()
            except Exception as e:
                print(f"Error on {item.path}: {e}")
        
        await db.commit()
        print(f"Backfilled {len(items)} videos")

asyncio.run(backfill())
