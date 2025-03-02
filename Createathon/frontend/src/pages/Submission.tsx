import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import MonacoEditor from "react-monaco-editor";

const Submission = () => {
  const { Id, challengeId } = useParams(); // Get user ID and Challenge ID from URL
  const [code, setCode] = useState("console.log('Hello, World!');");
  const [runnerOutput, setRunnerOutput] = useState("");
  const [expectedOutput, setExpectedOutput] = useState("Fetching expected output...");
  const [title , setTitle] = useState("Challenge");
  const[description , setDescription] = useState("Description");
  const [status, setStatus] = useState("Not Submitted");
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [pastSubmissions, setPastSubmissions] = useState<{ timestamp: string; status: string }[]>([]);
  
  const API_BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    fetchExpectedOutput();
  }, []);

  const fetchExpectedOutput = async () => {
    try {
        console.log(challengeId , "jkshs")
      const response = await axios.get(`${API_BASE_URL}/challenges/${challengeId}`);
      setTitle(response.data.title);
      setDescription(response.data.description);
      setExpectedOutput(response.data.expected_output);
      console.log(response.data.expected_output);
    } catch (error) {
      console.error("Error fetching challenge data:", error);
      setExpectedOutput("Error loading expected output.");
    }
  };

  const runCode = () => {
    try {
      let output = "";
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        output += args.join(" ") + "\n";
      };

      eval(code); // Execute the JavaScript code
      setRunnerOutput(output.trim());

      console.log = originalConsoleLog; // Restore console.log
    } catch (error) {
      setRunnerOutput((error as Error).message);
    }
  };

  const submitSolution = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/submissions/`, {
        user_id :Id,
        challenge_id:challengeId,
        submitted_output: runnerOutput,
      });

      setStatus(response.data.proceed === "yes" ? "Accepted" : "Wrong Answer");
    } catch (error) {
      console.error("Error submitting solution:", error);
      setStatus("Submission failed");
    }
  };

  const fetchPastSubmissions = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/submissions/${Id}`);

        if (!Array.isArray(response.data)) {
            console.error("Invalid response format:", response.data);
            return;
        }
        const response_data = response.data.filter(submission => submission.challenge_id === parseInt(challengeId || "0"));
        console.log(response.data, "Original Submissions");
        console.log(response_data, "jhsdsj")

        if (challengeId && response_data.length > 0) {
            setPastSubmissions(response_data);
            console.log(response_data, "Filtered Submissions");
        } else {
            console.log("No submissions found for this challenge.");
            setPastSubmissions([]); // Clear previous submissions if none found
        }

        setShowSubmissions(true);
    } catch (error) {
        console.error("Error fetching submissions:", error);
    }
};


  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>
      <p className="text-lg text-center mb-6">{description}</p>
      
      <div className="flex justify-center gap-4 mb-6">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg" onClick={submitSolution}>
          Submit Solution
        </button>
        <button className="bg-gray-600 text-white px-6 py-2 rounded-lg" onClick={fetchPastSubmissions}>
          Past Submissions
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 shadow-md rounded-lg">
          <h2 className="text-lg font-bold mb-2">Code Editor</h2>
          <MonacoEditor
            height="300px"
            width={"800px"}
            language="javascript"
            value={code}
            onChange={(newValue) => setCode(newValue)}
          />
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg mt-4" onClick={runCode}>
            Run Code
          </button>
        </div>

        <div className="bg-white p-4 shadow-md rounded-lg">
          <h2 className="text-lg font-bold">Expected Output</h2>
          <pre className="bg-gray-200 p-2 rounded mt-2">{expectedOutput}</pre>
          <h2 className="text-lg font-bold mt-4">Runner Output</h2>
          <pre className="bg-gray-200 p-2 rounded mt-2">{runnerOutput}</pre>
          <h2 className="text-lg font-bold mt-4">Status</h2>
          <pre className="bg-gray-200 p-2 rounded mt-2">{status}</pre>
        </div>
      </div>

    {showSubmissions && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-10 transition-opacity duration-300 z-7">
    <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 max-w-lg animate-fadeIn">
      <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">Past Submissions</h2>
      
      <div className="max-h-60 overflow-y-auto border rounded-md p-3 bg-gray-50">
        {pastSubmissions.length > 0 ? (
          <ul className="space-y-2">
            {pastSubmissions.map((submission, index) => (
              <li 
                key={index} 
                className="p-2 border-b border-gray-300 flex justify-between items-center text-sm text-gray-700"
              >
                <span className="font-medium">{submission.timestamp}</span>
                <span 
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    submission.status === "Accepted" 
                      ? "bg-green-200 text-green-800" 
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {submission.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center">No past submissions found.</p>
        )}
      </div>

      <button 
        className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
        onClick={() => setShowSubmissions(false)}
      >
        Close
      </button>
    </div>
  </div>
)}

    </div>
  );
};

export default Submission;
