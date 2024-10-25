// src/components/UploadAskPage.js
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import axios from "axios"; // Import Axios
import "../styles/global.css";

function UploadAskPage() {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null); // Store uploaded file

  const onDrop = useCallback((acceptedFiles) => {
    console.log(acceptedFiles);
    setFile(acceptedFiles[0]); // Store the first uploaded file
    setMessages((prev) => [...prev, { type: "file", content: acceptedFiles }]);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleSubmitPrompt = async () => {
    if (prompt || file) {
      setMessages((prev) => [...prev, { type: "user", content: prompt }]);
      setPrompt("");

      // Prepare form data to send
      const formData = new FormData();
      if (file) {
        formData.append("file", file); // Append file
      }
      formData.append("text", prompt); // Append prompt text

      try {
        const response = await axios.post(
          "http://localhost:3500/summarize",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        setMessages((prev) => [
          ...prev,
          { type: "bot", content: response.data.summary }, // Display summary
        ]);
        if (response.data.answer) {
          setMessages((prev) => [
            ...prev,
            { type: "bot", content: `Answer: ${response.data.answer}` }, // Display answer
          ]);
        }
      } catch (error) {
        console.error("Error:", error);
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content: "Error occurred while processing the request.",
          },
        ]);
      }
    }
  };

  return (
    <div className="container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Chat History</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index} className="history-item">
              {msg.type === "file" ? "Uploaded File" : msg.content}
            </li>
          ))}
        </ul>
      </div>

      {/* Chatbox */}
      <div className="chatbox-div">
        <div className="messages">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              className={`message ${msg.type === "user" ? "user" : "bot"}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {msg.type === "file" ? (
                <p>Uploaded a file: {msg.content[0].name}</p>
              ) : (
                <p>{msg.content}</p>
              )}
            </motion.div>
          ))}
        </div>

        <div className="chatInput-div">
          <motion.div
            {...getRootProps()}
            className="dropzone"
            whileHover={{
              scale: 1.05,
              boxShadow: "0px 15px 30px rgba(0, 0, 0, 0.1)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            <input {...getInputProps()} />
            <p>Drag & drop a PDF here or click to upload</p>
          </motion.div>
          <input
            type="text"
            placeholder="give topics or sections you want to summarize"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <motion.button
            onClick={handleSubmitPrompt}
            whileHover={{
              scale: 1.1,
              boxShadow: "0px 15px 30px rgba(0, 0, 0, 0.2)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            Submit Prompt
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default UploadAskPage;
