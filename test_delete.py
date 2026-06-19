import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String
from sqlalchemy.future import select

Base = declarative_base()

class TestModel(Base):
    __tablename__ = 'test'
    id = Column(Integer, primary_key=True)

async def main():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSession(engine) as session:
        session.add(TestModel(id=1))
        await session.commit()
        
        result = await session.execute(select(TestModel))
        item = result.scalar_one()
        
        try:
            await session.delete(item)
            print("Awaited successfully")
        except Exception as e:
            print(f"Error awaiting: {type(e)}: {e}")

asyncio.run(main())
