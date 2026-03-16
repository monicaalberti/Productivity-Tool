import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import '../../styles/Login.css';
import { IoIosMenu } from "react-icons/io";
import SidePanel from "../../components/SidePanel";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "../../AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { auth } = useAuth();


  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);
      navigate("/");
    } catch (err) {
      setError(err.message);
      return;
    }
  
  };

  return (
    <div className="login-container">
      <div className="header">
          <h1><a href="/"><span className="highlight">StudyWeave</span> - Login to your account</a></h1>
          <IoIosMenu className="menu-icon" size={40} title="Menu" onClick={() => setIsOpen(!isOpen)} />
      </div>

      <div className="login-form-container">
          <h4>Login form:</h4>
          <form className="login-form" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button className="login-button" type="submit">Login</button>
          </form>
          <h5>Don't have an account yet?</h5>
          <Link className="register-link" to="/register">Register here👈🏼</Link>
      </div>
      
      <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />

      {error && <p>{error}</p>}
    </div>
  );
}

export default Login;
