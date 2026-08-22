import React, { useState } from 'react'
import MembersContext from './MembersContext'

const MembersState = (props) => {
    const membersInitial = [""]
    const [members, setMembers] = useState(membersInitial)

    const [fetched, setFetched] = useState(false)

  return (
    <MembersContext.Provider value={{members, setMembers, fetched, setFetched}}>
        {props.children}
    </MembersContext.Provider>
  )
}

export default MembersState
