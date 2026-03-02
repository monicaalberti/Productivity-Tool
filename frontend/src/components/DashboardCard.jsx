import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DashboardCard.css";

function DashboardCard({ title, description, link, Icon }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-card" onClick={() => navigate(link)}>
      <div className="header-wrapper">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {Icon && <Icon className="card-icon" size={40} />}
    </div>
  );
}

export default DashboardCard;
