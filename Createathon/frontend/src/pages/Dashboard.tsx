import{ useState, useEffect } from "react";
import axios from "axios";
import { useNavigate  , useParams} from "react-router-dom";

interface Challenge {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  points: number;
}

interface LeaderboardEntry {
  user_id: number;
  username: string;
  last_submission_time: string;
  score: number;
}

const Dashboard = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<number | null>(null);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    difficulty: "Easy",
    points: 10,
    expected_output: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const API_BASE_URL = "http://127.0.0.1:8000";
  const token = localStorage.getItem("access_token");
  const navigate = useNavigate();
  const { Id } = useParams();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/challenges`, {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });
      setChallenges(response.data);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    }
  };

  const fetchLeaderboard = async (challengeId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leaderboard/${challengeId}`, {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });
      setLeaderboard(response.data);
      setSelectedChallenge(challengeId);
      setShowPopup(true);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const createChallenge = async () => {
    try {
      await axios.post(`${API_BASE_URL}/challenges`, newChallenge, {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });

      setSuccessMessage("Challenge created successfully!");
      setTimeout(() => {
        setShowCreatePopup(false);
        setSuccessMessage(null);
        fetchChallenges();
        setNewChallenge({
          title: "",
          description: "",
          difficulty: "Easy",
          points: 10,
          expected_output: "",
        });
      }, 1500);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setErrorMessage("Error creating challenge. Please try again.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-4xl font-bold text-center mb-8 text-blue-800">Createathon</h1>
      
      <div className="flex justify-end mb-6">
        <button 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300"
          onClick={() => setShowCreatePopup(true)}
        >
          Create New Challenge
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <div key={challenge.id} className="border p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">{challenge.title}</h2>
            <p className="text-gray-600 mb-4">{challenge.description}</p>
            <div className="flex justify-between items-center mb-4">
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                challenge.difficulty === "Easy" ? "bg-green-200 text-green-800" :
                challenge.difficulty === "Medium" ? "bg-yellow-200 text-yellow-800" :
                "bg-red-200 text-red-800"
              }`}>
                {challenge.difficulty}
              </span>
              <span className="text-lg font-bold text-blue-600">{challenge.points} pts</span>
            </div>
            <div className="flex gap-3">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 flex-1"
                onClick={() => fetchLeaderboard(challenge.id)}
              >
                View Leaderboard
              </button>
              <button 
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition duration-300 flex-1"
              onClick={() => navigate(`/submission/${Id}/${challenge.id}`)}
            >
              Submit Solution
            </button>
            </div>
          </div>
        ))}
      </div>

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-11/12 max-w-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Leaderboard - Challenge {selectedChallenge}</h2>
            {leaderboard.length > 0 ? (
              <ul className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <li key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition duration-300">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800">{entry.username}</p>
                        <p className="text-sm text-gray-600">
                          Last Submission: {new Date(entry.last_submission_time).toLocaleString()}
                        </p>
                      </div>
                      <span className="font-bold text-blue-600">{entry.score} pts</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-center">No submissions yet.</p>
            )}
            <button className="mt-6 bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition duration-300 w-full" onClick={() => setShowPopup(false)}>
              Close
            </button>
          </div>
        </div>
      )}

{showCreatePopup && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-8 rounded-lg shadow-lg w-11/12 max-w-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Create New Challenge</h2>

      {errorMessage && <p className="text-red-500 text-center mb-2">{errorMessage}</p>}
      {successMessage && <p className="text-green-500 text-center mb-2">{successMessage}</p>}

      <input
        type="text"
        placeholder="Title"
        className="w-full p-2 border rounded mb-3"
        value={newChallenge.title}
        onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
      />

      <textarea
        placeholder="Description"
        className="w-full p-2 border rounded mb-3"
        value={newChallenge.description}
        onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
      />

      <input
        type="text"
        placeholder="Expected Output"
        className="w-full p-2 border rounded mb-3"
        value={newChallenge.expected_output}
        onChange={(e) => setNewChallenge({ ...newChallenge, expected_output: e.target.value })}
      />

      <input
        type="number"
        placeholder="Points"
        className="w-full p-2 border rounded mb-3"
        value={newChallenge.points}
        onChange={(e) => setNewChallenge({ ...newChallenge, points: parseInt(e.target.value) || 0 })}
      />

      <select
        className="w-full p-2 border rounded mb-3"
        value={newChallenge.difficulty}
        onChange={(e) => setNewChallenge({ ...newChallenge, difficulty: e.target.value })}
      >
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>

      <button className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition duration-300" onClick={createChallenge}>
        Submit
      </button>

      <button className="w-full bg-gray-400 text-white p-2 rounded-lg mt-3 hover:bg-gray-500 transition duration-300" onClick={() => setShowCreatePopup(false)}>
        Cancel
      </button>
    </div>
  </div>
)}

    </div>
  );
};

export default Dashboard;
