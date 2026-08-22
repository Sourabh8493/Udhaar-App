import React from 'react'

const OpRecordItem = (props) => {
    const {opRecord} = props
  return (
    <div>
      <div className="card" style={{ width: "30rem" }}>
        <div className="card-body">
          <h5 className="card-title">
            {`${opRecord.to.name} -> ${opRecord.from.name}`}{" "}
          </h5>
          <p className="card-text">
            Amount: {opRecord.amount} <br />
          </p>
        </div>
      </div>
    </div>
  )
}

export default OpRecordItem
