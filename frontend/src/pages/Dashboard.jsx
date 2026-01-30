import React, { useState } from "react";
import DashboardCard from "../components/DashboardCard";
import { IoIosMenu } from "react-icons/io";
import "../styles/Dashboard.css";
import SidePanel from "../components/SidePanel";
import { MdOutlineAccountCircle } from "react-icons/md";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

function Dashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="account">
        {user ? (
          <div>
            <Link to="/account">
              <MdOutlineAccountCircle className="account-icon" size={35} title="My Account" />
            </Link><br/>
            <Link className="logout-button" to="/" onClick={logout}>Logout</Link>
          </div>
        ) : <p><Link to="/login">Login</Link> / <Link to="/register">Register</Link></p> 
        }  
      </div>
      <h1><a href="/">StudyWeave - Your Dashboard</a></h1>
      <IoIosMenu className="menu-icon" size={30} title="Menu" onClick={() => setIsOpen(!isOpen)} />
      
      <div className="dashboard-grid">
        <DashboardCard
          title="Upload Documents"
          description="Add new files"
          link="/upload"
        />

        <DashboardCard
          title="Your Documents"
          description="View and manage your docs"
          link="/documents"
        />

        <DashboardCard
          title="Diary"
          description="Write reflections"
          link="/diary"
        />

        <DashboardCard
          title="Kanban Board"
          description="Manage your study tasks"
          link="/kanban"
        />
      </div>

      <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
    
  );
}

export default Dashboard;
