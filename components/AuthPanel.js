"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function AuthPanel() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setNotice("Account created — check your email to confirm it, then log in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // onAuthStateChange in page.js picks this up automatically.
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card center-card">
      <span className="big-icon">🔐</span>
      <h3>{mode === "signup" ? "Create your account" : "Log in"}</h3>
      <p className="copy">
        {mode === "signup"
          ? "Create a trader account, then subscribe to unlock the calculator."
          : "Log in to your trader account."}
      </p>
      <form className="form-col" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="copy">{notice}</p>}
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
        </button>
      </form>
      <button
        type="button"
        className="link-btn"
        onClick={() => {
          setMode(mode === "signup" ? "login" : "signup");
          setError("");
          setNotice("");
        }}
      >
        {mode === "signup"
          ? "Already have an account? Log in"
          : "New here? Create an account"}
      </button>
    </div>
  );
}
