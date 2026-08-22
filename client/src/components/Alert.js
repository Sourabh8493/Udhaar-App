import React, { useContext } from 'react'
import AlertContext from '../context/AlertContext';

function Alert(props) {
    const context = useContext(AlertContext)
    const {alert} = context
    const capitalize = (word) => {
        if (word === "danger") {
            word = "error"
        }
        const lower = word.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }
  return (
    <div className="container px-3" style={{minHeight: alert ? "auto" : 0}}>
      {alert && <div className={`alert alert-${alert.type} alert-dismissible fade show mt-2`} role="alert">
            <strong>{capitalize(alert.type)}!</strong> {alert.msg}
        </div>}
    </div>
  )
}

export default Alert
