import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../styles/Register.css';
import { IoIosMenu } from "react-icons/io";
import SidePanel from "../../components/SidePanel";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../../firebase";


function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
  e.preventDefault();

  if (password !== repeatPassword) {
    setError("Passwords do not match");
    return;
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await sendEmailVerification(userCredential.user);
    window.alert("Registration successful! Please check your email for verification.");
    navigate("/login");
  } catch (err) {
    setError(err.message);
  }

  
};

return (
    <div className="register-container">
      <h1><a href="/">StudyWeave - Register for an account</a></h1>
      <IoIosMenu className="menu-icon" size={30} title="Menu" onClick={() => setIsOpen(!isOpen)} />
      <h4>Register form:</h4>
      <form className="register-form" onSubmit={handleRegister}>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

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

        <input
          type="password"
          placeholder="Repeat Password"
          value={repeatPassword}
          onChange={(e) => setRepeatPassword(e.target.value)}
          required
        />

        <button type="submit">Register</button>
      </form>

      <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />

      {error && <p>{error}</p>}
    </div>
  );

// };


  // const handleRegister = async (e) => {
  //   e.preventDefault();

  //   if (password !== repeatPassword) {
  //     setError("Passwords do not match");
  //     return;
  //   }

  //   try {
  //   const res = await fetch("http://127.0.0.1:8000/register", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json"
  //     },
  //     body: JSON.stringify({ username, email, password })
  //   });

  //     if (!res.ok) {
  //       const errorData = await res.json();
  //       setError(errorData.detail || "Registration failed");
  //       return;
  //     }

  //     const data = await res.json();
  //     console.log(data.message);
  //     window.alert("Registration successful! Please log in.");
    
      
  //   } catch (err) {
  //     console.error(err);
  //     setError("Network error");
  //   } finally {
  //     navigate("/login");
  //   }

  };

  
// }

export default Register;
