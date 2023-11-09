import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import {Configuration, OpenAIApi} from 'openai';

dotenv.config();

console.log(process.env.OPENAI_API_KEY)

//const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    organization: "org-21fcpxo41sLmQF2F7vGHG9vo",
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', async (req,res) => {
    res.status(200).send({
        message: 'Hello from GPT',
    })
});

app.post('/', async (req,res) => {
    try {
        const prompt = req.body.prompt;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            prompt: `${prompt}`,
            temperature: 0,
            max_tokens: 3000,
            top_p: 1,
            frequency_penalty: 0.5,
            presence_penalty: 0,
        });

        res.status(200).send({
            bot: response.data.choices[0].text
        })
    } catch (error) {
        console.error(error)
        res.status(500).send(error || 'Something went wrong');
    }
})

app.listen(5000, () => console.log('Server is running on port http://localhost:5000/'));
