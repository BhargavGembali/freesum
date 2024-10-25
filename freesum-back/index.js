const express = require("express");
const axios = require("axios");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const multer = require("multer");

const app = express();
const PORT = 3500;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const HUGGING_FACE_API_KEY = "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"; // Replace with your actual key

async function summarizeText(text) {
  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn", // Updated model for summarization
      { inputs: text },
      { headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}` } }
    );
    return response.data[0].summary_text;
  } catch (error) {
    console.error("Error details:", error.response?.data || error.message);
    throw new Error("Summarization failed");
  }
}

async function answerQuestion(context, question) {
  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2", // Model for question answering
      {
        inputs: {
          question: question,
          context: context,
        },
      },
      { headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}` } }
    );
    return response.data[0].answer;
  } catch (error) {
    console.error("Error details:", error.response?.data || error.message);
    throw new Error("Question answering failed");
  }
}

const upload = multer({ dest: "uploads/" }); // Folder to temporarily store uploaded files

app.post("/summarize", upload.single("file"), async (req, res) => {
  const { text, question } = req.body;
  let inputText = text;

  if (req.file) {
    try {
      const pdfBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(pdfBuffer);
      inputText = pdfData.text;
    } catch (error) {
      return res.status(500).json({ error: "Failed to process PDF" });
    } finally {
      fs.unlinkSync(req.file.path); // Remove file after processing
    }
  }

  try {
    const summary = await summarizeText(inputText);

    let answer = "";
    if (question) {
      answer = await answerQuestion(inputText, question);
    }

    res.json({ summary, answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
