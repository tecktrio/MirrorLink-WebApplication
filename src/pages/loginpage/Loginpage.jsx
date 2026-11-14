import React, { useContext, useState } from "react";
import { FormDataContext } from "../../Contexts/FormDataContexts";
import { MAKE_LOGIN } from "../../serverRequests/ServerRequests";
import { useNavigate, Link } from "react-router-dom";
import { DebugLevelLoginContext } from "../../Contexts/DebugLevelContext";
import { LoadingStateContext } from "../../Contexts/LoadingStateContext";
import Loadinpage from "../loadingpage/Loadinpage";
import { CookieContext } from "../../Contexts/CookieContext";
import "../registerpage/RegisterPage.css";
import "./LoginPage.css";

export default function Loginpage() {
  const { DEBUG_LEVEL } = useContext(DebugLevelLoginContext);
  const { setCookie } = useContext(CookieContext);
  const { isLoading, setIsLoading } = useContext(LoadingStateContext);
  const { formdata, setformdata } = useContext(FormDataContext);
  const [username, setusername] = useState(formdata?.email || "");
  const [password, setpassword] = useState("");
  const [message, setmessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const HandleLogin = async (e) => {
    e.preventDefault();
    setformdata({ ...formdata, username, password });
    setIsSubmitting(true);
    setmessage("");

    MAKE_LOGIN(username, password)
      .then(({ key, planActive }) => {
        if (DEBUG_LEVEL === 3) console.log("Login Successful");
        setIsSubmitting(false);
        setCookie("login_key", key, 30);
        setCookie("username", username, 30);
        const nextPath = new URLSearchParams(window.location.search).get("next");
        navigate(!planActive ? "/pricing" : (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/setup"));
      })
      .catch((error) => {
        console.error("Login failed:", error);
        setIsSubmitting(false);
        setmessage("Invalid username or password. Please verify credentials.");
      });
  };

  return (
    <>
      {isLoading ? (
        <Loadinpage />
      ) : (
        <main className="ml-landing ml-auth-page ml-login-page">
          <header className="ml-nav">
            <Link className="ml-brand" to="/"><span className="ml-brand-mark">M</span><span>MirrorLink</span></Link>
            <nav className="ml-nav-links" aria-label="Main navigation"><Link to="/">Overview</Link><Link to="/pricing">Pricing</Link></nav>
            <Link className="ml-nav-cta" to={`/register${window.location.search}`}>Create account <span className="ml-arrow">↗</span></Link>
          </header>
          <section className="ml-auth-layout">
            <div className="ml-auth-intro">
              <div className="ml-eyebrow"><span /> YOUR SCREENS, IN SYNC</div>
              <h1>Welcome<br />back to <span>control.</span></h1>
              <p className="ml-hero-description">Sign in to organize your sites, prepare mirror displays, and manage the content you share across your network.</p>
              <div className="ml-hero-note"><span className="ml-note-line" /> One place to manage. Any screen to share.</div>
            </div>
            <form className="ml-auth-card" onSubmit={HandleLogin}>
              <div className="ml-auth-step">MIRRORLINK ACCOUNT <span>SECURE SIGN IN</span></div>
              <h2>Sign in</h2>
              <p className="ml-auth-caption">Use your account email and password to continue.</p>
              {message && <div className="ml-auth-message ml-login-error" role="alert">{message}</div>}
              <label className="ml-auth-field"><span>Email address</span><input type="email" autoComplete="email" placeholder="you@example.com" value={username} onChange={(event) => setusername(event.target.value)} required /></label>
              <label className="ml-auth-field"><span>Password</span><input type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setpassword(event.target.value)} required /></label>
              <div className="ml-login-forgot"><Link to="/reset-password">Forgot password?</Link></div>
              <button className="ml-button ml-button-dark ml-auth-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in to MirrorLink"}<span className="ml-arrow">→</span></button>
              <p className="ml-auth-foot">New to MirrorLink? <Link to={`/register${window.location.search}`}>Create an account</Link></p>
            </form>
          </section>
          <footer className="ml-footer"><Link className="ml-brand" to="/"><span className="ml-brand-mark">M</span><span>MirrorLink</span></Link><span>Wireless display management</span></footer>
        </main>
      )}
    </>
  );
}
