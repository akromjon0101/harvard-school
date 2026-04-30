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
        
        <h1 className="maintenance-title">Serverda muammo yuzaga keldi</h1>
        
        <p className="maintenance-text">
          Hozirda tizimda texnik muammolar kuzatilmoqda. 
          Mutaxassislarimiz nosozlikni bartaraf etish ustida ish olib borishmoqda.
        </p>
        
        <div className="maintenance-footer">
          &copy; {new Date().getFullYear()} Harvard School IELTS. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default Maintenance
