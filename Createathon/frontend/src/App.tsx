import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  interface Challenge {
    id: number;
    title: string;
  }

  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    const response = axios.get('http://localhost:9000/api/challenges/')
      .then(response => setChallenges(response.data))
      .catch(error => console.error(error));
      console.log(response)
  }, []);

  return (
    <div>
      <h1>Challenges</h1>
      <ul>
        {challenges.map(challenge => (
          <li key={challenge?.id}>{challenge?.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;