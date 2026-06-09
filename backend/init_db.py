import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.room import Room
from app.models.script import Script, ScriptDifficulty, ScriptType
from app.models.host import Host
from decimal import Decimal


def init_database():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            print("Creating default admin user...")
            admin = User(
                username="admin",
                email="admin@example.com",
                phone="13800138000",
                full_name="系统管理员",
                role=UserRole.ADMIN,
                hashed_password=get_password_hash("admin123"),
                is_active=True,
            )
            db.add(admin)

        if not db.query(User).filter(User.username == "owner").first():
            print("Creating default owner user...")
            owner = User(
                username="owner",
                email="owner@example.com",
                phone="13900139000",
                full_name="门店店主",
                role=UserRole.OWNER,
                hashed_password=get_password_hash("owner123"),
                is_active=True,
            )
            db.add(owner)

        if not db.query(User).filter(User.username == "player1").first():
            print("Creating default player user...")
            player = User(
                username="player1",
                email="player1@example.com",
                phone="13700137000",
                full_name="玩家小明",
                role=UserRole.PLAYER,
                hashed_password=get_password_hash("player123"),
                is_active=True,
            )
            db.add(player)

        if not db.query(Room).first():
            print("Creating default rooms...")
            rooms = [
                Room(name="古风堂", capacity=8, description="古典中式装修，适合古风本", equipment="汉服、古风道具、音响", location="1楼"),
                Room(name="推理室", capacity=6, description="现代简约风格，适合硬核推理", equipment="白板、线索卡、计时器", location="1楼"),
                Room(name="恐怖屋", capacity=7, description="暗黑风格，配有恐怖道具", equipment="灯光效果、恐怖音效、NPC道具", location="2楼"),
                Room(name="情感阁", capacity=5, description="温馨舒适，适合情感本", equipment="蜡烛灯、沙发、音乐设备", location="2楼"),
                Room(name="机制房", capacity=10, description="大空间，适合机制阵营本", equipment="大桌、地图、道具柜", location="3楼"),
            ]
            db.add_all(rooms)

        if not db.query(Script).first():
            print("Creating default scripts...")
            scripts = [
                Script(
                    name="雾都往事",
                    author="张三",
                    publisher="XYZ出版社",
                    description="民国时期的重庆，一场雾中的阴谋与情感纠葛...",
                    difficulty=ScriptDifficulty.MEDIUM,
                    script_type=ScriptType.EMOTION,
                    min_players=5,
                    max_players=7,
                    duration_minutes=240,
                    price=Decimal("128.00"),
                    tags="民国,情感,推理",
                ),
                Script(
                    name="密室逃脱",
                    author="李四",
                    publisher="ABC工作室",
                    description="一群陌生人被困在密室中，必须合作才能逃生...",
                    difficulty=ScriptDifficulty.HARD,
                    script_type=ScriptType.SUSPENSE,
                    min_players=4,
                    max_players=6,
                    duration_minutes=300,
                    price=Decimal("158.00"),
                    tags="密室,硬核,推理",
                ),
                Script(
                    name="阴缘",
                    author="王五",
                    publisher="恐怖屋",
                    description="一段跨越阴阳的爱情故事，恐怖与情感交织...",
                    difficulty=ScriptDifficulty.MEDIUM,
                    script_type=ScriptType.HORROR,
                    min_players=6,
                    max_players=8,
                    duration_minutes=270,
                    price=Decimal("148.00"),
                    tags="恐怖,情感,古风",
                ),
                Script(
                    name="欢乐斗地主",
                    author="赵六",
                    publisher="欢乐坊",
                    description="轻松欢乐的机制本，适合朋友聚会...",
                    difficulty=ScriptDifficulty.EASY,
                    script_type=ScriptType.HAPPY,
                    min_players=5,
                    max_players=9,
                    duration_minutes=180,
                    price=Decimal("98.00"),
                    tags="欢乐,机制,聚会",
                ),
                Script(
                    name="权倾天下",
                    author="孙七",
                    publisher="策略家",
                    description="宫廷权谋，阵营对抗，谁能笑到最后...",
                    difficulty=ScriptDifficulty.HARD,
                    script_type=ScriptType.MECHANISM,
                    min_players=6,
                    max_players=10,
                    duration_minutes=360,
                    price=Decimal("188.00"),
                    tags="机制,阵营,权谋",
                ),
            ]
            db.add_all(scripts)

        db.commit()
        print("Default data created successfully!")
        print("\nDefault accounts:")
        print("  admin / admin123 (管理员)")
        print("  owner / owner123 (店主)")
        print("  player1 / player123 (玩家)")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
