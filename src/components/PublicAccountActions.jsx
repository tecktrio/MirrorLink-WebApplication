import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "./PublicAccountActions.css";

export default function PublicAccountActions({ className = "" }) {
  const navigate = useNavigate();
  const name = Cookies.get("username");

  const signOut = () => {
    ["login_key", "username", "mirror_id", "site_id"].forEach((key) => Cookies.remove(key, { path: "/" }));
    navigate("/");
  };

  if (!Cookies.get("login_key")) {
    return <Link className={className} to="/login">Control panel</Link>;
  }

  const initials = (name || "M").trim().split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "M";
  return (
    <div className={`ml-account-actions ${className}`}>
      <Link className="ml-account-panel" to="/setup">Control panel</Link>
      <span className="ml-account-avatar" aria-hidden="true">{initials}</span>
      <span className="ml-account-name" title={name || "MirrorLink account"}>{name || "MirrorLink account"}</span>
      <button className="ml-account-signout" type="button" onClick={signOut}>Sign out</button>
    </div>
  );
}
