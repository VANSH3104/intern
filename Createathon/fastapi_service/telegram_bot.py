import asyncio
import requests
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command
from aiogram.types import Message
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State
from dotenv import load_dotenv
import os
load_dotenv()
TOKEN = os.getenv('TOKEN')
# FastAPI Backend URLs
FASTAPI_URL = "http://127.0.0.1:8000"
BACKEND_URL = "http://127.0.0.1:8001"

# Initialize bot and dispatcher
bot = Bot(token=TOKEN)
dp = Dispatcher()

logging.basicConfig(level=logging.INFO)

# FSM for user registration
class RegisterState(StatesGroup):
    email = State()
    username = State()
    password = State()

@dp.message(Command("start"))
@dp.message(Command("start"))
async def start(message: Message):
    commands_text = """
👋 Welcome to the Coding Platform Bot!
Here are the available commands:

📜 **Challenges**
➡️ `/challenges` - View available coding challenges.

🚀 **Submit Solution**
➡️ `/submit <challenge_id> <output>` - Submit your solution.

🏆 **Leaderboard**
➡️ `/leaderboard <challenge_id>` - View the leaderboard for a challenge.

🔑 **Authentication**
➡️ You will be automatically registered if needed.

Use these commands to interact with the platform. Happy coding! 🖥️⚡
    """
    await message.answer(commands_text)

@dp.message(Command("challenges"))
async def get_challenges(message: Message):
    response = requests.get(f"{FASTAPI_URL}/challenges/")
    if response.status_code == 200:
        challenges = response.json()
        text = "\n".join([f"🔹 {c['id']}: {c['title']} - {c['difficulty']}" for c in challenges])
        await message.answer(f"📜 Available Challenges:\n{text}\n\nUse /submit <challenge_id> <output> to submit.")
    else:
        await message.answer("❌ Failed to fetch challenges.")

@dp.message(lambda message: message.text.startswith("/submit"))
async def submit_solution(message: Message, state: FSMContext):
    try:
        _, challenge_id, submitted_output = message.text.split(" ", 2)
        user_id = message.from_user.id  

        # Step 1: Check if user exists by attempting login
        login_payload = {"username": str(user_id), "password": "dummy"}
        user_check = requests.post(f"{BACKEND_URL}/auth/login/", json=login_payload)

        if user_check.status_code != 200:
            await state.update_data(challenge_id=challenge_id, submitted_output=submitted_output)
            await message.answer("🔐 You are not registered! Please enter your email:")
            await state.set_state(RegisterState.email)
            return  

        # Step 2: Submit solution
        payload = {"user_id": user_id, "challenge_id": int(challenge_id), "submitted_output": submitted_output}
        response = requests.post(f"{FASTAPI_URL}/submissions/", json=payload)

        if response.status_code == 200:
            result = response.json()
            if result["proceed"] == "yes":
                await message.answer("✅ Submission Accepted!")
            else:
                await message.answer("❌ Wrong Answer! Try again.")
        else:
            await message.answer("⚠️ Submission failed.")
    except ValueError:
        await message.answer("⚠️ Invalid format! Use /submit <challenge_id> <output>.")

@dp.message(RegisterState.email)
async def register_email(message: Message, state: FSMContext):
    await state.update_data(email=message.text)
    await message.answer("🔑 Enter your desired username:")
    await state.set_state(RegisterState.username)

@dp.message(RegisterState.username)
async def register_username(message: Message, state: FSMContext):
    await state.update_data(username=message.text)
    await message.answer("🛡️ Enter your password:")
    await state.set_state(RegisterState.password)

@dp.message(RegisterState.password)
async def register_password(message: Message, state: FSMContext):
    user_data = await state.get_data()
    user_id = message.from_user.id
    email = user_data["email"]
    username = user_data["username"]
    password = message.text

    # Step 1: Register user
    registration_payload = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "password": password,
    }
    register_response = requests.post(f"{BACKEND_URL}/auth/register/", json=registration_payload)

    if register_response.status_code == 201:
        await message.answer("✅ Registration successful! Verifying...")

        # Step 2: Wait before validation
        await asyncio.sleep(2)

        # Step 3: Try logging in
        login_payload = {"username": str(user_id), "password": password}
        user_check = requests.post(f"{BACKEND_URL}/auth/login/", json=login_payload)

        if user_check.status_code == 200:
            await message.answer("✅ You are now registered! Submitting your solution...")

            # Step 4: If submission was stored, retry it
            if "challenge_id" in user_data and "submitted_output" in user_data:
                payload = {
                    "user_id": user_id,
                    "challenge_id": int(user_data["challenge_id"]),
                    "submitted_output": user_data["submitted_output"],
                }
                response = requests.post(f"{FASTAPI_URL}/submissions/", json=payload)

                if response.status_code == 200:
                    result = response.json()
                    if result["proceed"] == "yes":
                        await message.answer("✅ Submission Accepted!")
                    else:
                        await message.answer("❌ Wrong Answer! Try again.")
                else:
                    await message.answer("⚠️ Submission failed.")
        else:
            await message.answer("⚠️ Registration successful, but login failed. Try submitting again.")

    else:
        await message.answer("❌ Registration failed. Please try again.")

    await state.clear()  

@dp.message(Command("leaderboard"))
async def get_leaderboard(message: Message):
    args = message.text.split()
    if len(args) < 2:
        await message.answer("⚠️ Use /leaderboard <challenge_id>")
        return
    
    challenge_id = args[1]
    response = requests.get(f"{FASTAPI_URL}/leaderboard/{challenge_id}")

    if response.status_code == 200:
        leaderboard = response.json()
        text = "\n".join([f"🏆 {entry['username']}: {entry['score']} pts" for entry in leaderboard])
        await message.answer(f"📊 Leaderboard for Challenge {challenge_id}:\n{text}")
    else:
        await message.answer("❌ Failed to fetch leaderboard.")

async def main():
    """Start polling the bot."""
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
