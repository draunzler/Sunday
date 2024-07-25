from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
from fastapi.encoders import jsonable_encoder
import google.generativeai as genai
import openai
import os
import logging
import uvicorn
from langchain.chains import LLMChain
from langchain_google_genai import GoogleGenerativeAI
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate

load_dotenv()

class PromptRequest(BaseModel):
    prompt: str
    model: str = "gpt-3.5-turbo"

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

client = OpenAI(
  organization = os.getenv('ORGANISATION_ID'),
  project = os.getenv('PROJECT_ID'),
)

# Initialize OpenAI API
openai.api_key = os.getenv('OPENAI_API_KEY')

genai_api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
gemini_model = genai.GenerativeModel('gemini-1.5-pro')
google_llm = GoogleGenerativeAI(api_key=genai_api_key, model="gemini-1.5-pro")

prompt = PromptTemplate(
    input_variables=["history", "input"],
    template="The following is a conversation with an AI assistant named Sunday. The assistant is helpful, creative, clever, and very friendly.\n\n{history}\nHuman: {input}\nAI:\n\nIf the user requests a chart and only then, provide a table of data at the end of your response that can be used to generate the chart. The table should be formatted clearly with columns and rows. If not asked explicitly for a chart or a table, you DO NOT need to provide a table."
)

memory = ConversationBufferMemory(memory_key="history")

llm_chain = LLMChain(
    llm=google_llm,
    prompt=prompt,
    memory=memory
)

logger.info("main.py is being executed")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from GPT"}

@app.post("/")
async def generate_response(prompt_request: PromptRequest):
    try:
        prompt = prompt_request.prompt
        logger.debug(f"Received prompt: {prompt}")

        logger.info(f"Input Tokens (length: {len(prompt.split())}): {prompt}")

        # if len(prompt.split()) > 4096:
        #     model = gemini_model

        # if model == "gpt-3.5-turbo":
        #     stream = client.chat.completions.create(
        #         model="gpt-3.5-turbo",
        #         messages=[{"role": "user", "content": prompt}],
        #         stream=True,
        #     )
        #     content = ""
        #     for chunk in stream:
        #         if chunk.choices[0].delta.content is not None:
        #             content += chunk.choices[0].delta.content

        #     return content
        # else:
        # response = gemini_model.generate_content(prompt)
        response = llm_chain.predict(input=prompt)
        logger.info(f"{response}")
        return {"bot": response}
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong")
    
@app.post("/forget")
async def forget_memory():
  try:
    memory.clear()

    return {"message": "Memory cleared successfully"}
  except Exception as e:
    logger.error(f"Error clearing memory: {e}")
    raise HTTPException(status_code=500, detail="Something went wrong")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
