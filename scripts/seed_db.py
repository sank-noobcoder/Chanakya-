#!/usr/bin/env python3
"""Database seeder for Chanakya development environment."""

import asyncio
import uuid
from sqlalchemy import text
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal


async def seed():
    async with AsyncSessionLocal() as session:
        print("[*] Seeding database with initial admin and engineer accounts...")
        admin_pass = hash_password("ChanakyaAdmin2026!Secure")
        engineer_pass = hash_password("ChanakyaEngineer2026!")
        user_pass = hash_password("ChanakyaUser2026!Standard")

        # Parameterized insert
        await session.execute(
            text("""
                INSERT INTO users (id, email, password_hash, role, is_active)
                VALUES 
                  (:admin_id, 'admin@chanakya.gov.in', :admin_pass, 'admin', true),
                  (:eng_id, 'engineer@iit.ac.in', :eng_pass, 'engineer', true),
                  (:user_id, 'analyst@iocl.in', :user_pass, 'user', true)
                ON CONFLICT (email) DO NOTHING
            """),
            {
                "admin_id": uuid.uuid4(),
                "admin_pass": admin_pass,
                "eng_id": uuid.uuid4(),
                "eng_pass": engineer_pass,
                "user_id": uuid.uuid4(),
                "user_pass": user_pass,
            }
        )
        await session.commit()
        print("[+] Seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
