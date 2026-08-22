import AlertContext from "./AlertContext";
import React, { useRef, useState } from 'react'

const AlertState = (props) => {
    const [alert, setAlert] = useState(null)
    const timeoutRef = useRef(null)

    const showAlert = (msg, type) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        setAlert({
            msg: msg,
            type: type
        })

        timeoutRef.current = setTimeout(() => {
            setAlert(null)
        }, 2500)
    }
  return (
    <AlertContext.Provider value={{alert, showAlert}}>
        {props.children}
    </AlertContext.Provider>
  )
}

export default AlertState
