import React from 'react'
import '../styles/maintenance.css'

const Maintenance = () => {
  return (
    <div className="maintenance-container">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>
      
      <div className="maintenance-content">
        <div className="maintenance-icon">🚀</div>
        
        <div className="maintenance-status">
          <span className="status-dot"></span>
          Maintenance in Progress
        </div>
        
        <h1 className="maintenance-title">Server Error Occurred</h1>
        
        <p className="maintenance-text">
          We are currently experiencing technical difficulties. 
          Our specialists are working hard to resolve the issue as soon as possible.
        </p>
        
        <div className="maintenance-footer">
          &copy; {new Date().getFullYear()} Harvard School IELTS. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default Maintenance
