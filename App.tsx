import { useState } from "react";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:3000/login-jwt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();
      console.log(data);

      if (data.token) {
        setResult("Login berhasil!");
        localStorage.setItem("token", data.token);
      } else {
        setResult(data.message);
      }
    } catch (err) {
      console.error(err);
      setResult("Error login");
    }
  };

  return (
    <div>
      <input
        placeholder="email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>
        Login
      </button>

      <p>{result}</p>
    </div>
  );
}