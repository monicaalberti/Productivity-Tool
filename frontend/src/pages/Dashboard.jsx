import React, { useState } from "react";
import DashboardCard from "../components/DashboardCard";
import { IoIosMenu } from "react-icons/io";
import "../styles/Dashboard.css";
import SidePanel from "../components/SidePanel";
import { MdOutlineAccountCircle, MdViewKanban } from "react-icons/md";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

import { FaUpload } from "react-icons/fa6";
import { IoDocumentsOutline } from "react-icons/io5";
import { TbPresentationAnalytics } from "react-icons/tb";
import { MdOutlineViewKanban } from "react-icons/md";
import { IoJournalOutline } from "react-icons/io5";
import { ZIndexLayer } from "recharts";

function Dashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="bg-layer bg-back"></div>
      <div className="bg-layer bg-front"></div>
      <div className="bg-layer bg-front2"></div>
      <div className="header" id="header-container">
        <div className="account">
        {user ? (
          <div>
            <Link to="/account">
              <MdOutlineAccountCircle className="account-icon" size={40} title="My Account" />
            </Link><br/>
            <Link className="logout-button" to="/" onClick={logout}>Logout</Link>
          </div>
          ) : <p><Link to="/login">Login</Link> / <Link to="/register">Register</Link></p> 
          }  
        </div>
        <h1><a href="/"><span className="highlight">StudyWeave</span> - Your Dashboard</a></h1>
        <IoIosMenu className="menu-icon" size={40} title="Menu" onClick={() => setIsOpen(!isOpen)} />      
      </div>
      
      <div className="dashboard-grid">
        <div className="top-row">
          <DashboardCard
            title="Upload Documents"
            description="Add new files to your collection."
            link="/upload"
            Icon={FaUpload}
            className="upload-card"
          />

          <DashboardCard
            title="Your Documents"
            description="View and manage your current documents."
            link="/documents"
            Icon={IoDocumentsOutline}
            className="docs-card"
          />

          <DashboardCard
            title="Diary"
            description="Write reflections on your work and mindfulness."
            link="/journal"
            Icon={IoJournalOutline}
            className="diary-card"
          />
        </div>
        
        <div className="bottom-row">
          <DashboardCard
            title="Kanban Board"
            description="Manage your study tasks."
            link="/kanban"
            Icon={MdOutlineViewKanban}
            className="tasks-card"
          />

          <DashboardCard
            title="Analytics"
            description="View your analytics to see your progress."
            link="/analytics"
            Icon={TbPresentationAnalytics}
            className="analytics-card"
          />
        </div>
        
      </div>

      <SidePanel isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
    
  );
}

export default Dashboard;
