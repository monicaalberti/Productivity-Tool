import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

function VerifyAccount() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      return;
    }

    fetch(`http://127.0.0.1:8000/verify?token=${token}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [searchParams]);

  return (
    <div style={{ textAlign: "center", marginTop: "5rem" }}>
      {status === "loading" && <p>Verifying your account...</p>}
      {status === "success" && <h2>✅ Account verified successfully!</h2>}
      {status === "error" && <h2>❌ Invalid or expired verification link.</h2>}
    </div>
  );
}

export default VerifyAccount;
