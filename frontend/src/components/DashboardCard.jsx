import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DashboardCard.css";

function DashboardCard({ title, description, link, Icon }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-card" onClick={() => navigate(link)}>
      <h2>{title}</h2>
      <p>{description}</p>
      {Icon && <Icon className="card-icon" />}
    </div>
  );
}

export default DashboardCard;
