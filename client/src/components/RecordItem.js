import React, { useContext, useState } from "react";
import { useParams } from "react-router-dom";
import RecordContext from "../context/RecordContext";
import GroupContext from "../context/GroupContext";

const RecordItem = (props) => {
  const {record} = props
  const {deleteRecord, updateRecord, declineRecord, settleRecord} = useContext(RecordContext)
  const {currentUser} = useContext(GroupContext)
  const {groupid} = useParams()

  const [isConfirming, setIsConfirming] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSettling, setIsSettling] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editAmount, setEditAmount] = useState(record.amount)
  const [editNote, setEditNote] = useState(record.note)

  const busy = isConfirming || isDeclining || isDeleting || isSettling

  const isMine = currentUser.email === record.from.email || currentUser.email === record.to.email
  const isCreator = currentUser && record.user === currentUser._id
  const isRecipient = currentUser.email === record.to.email
  // Only the creator - the person who is owed the money - can mark a
  // record as Done. The recipient (who owes the money) shouldn't be
  // able to unilaterally declare their own debt settled.
  const canSettle = record.status === "confirmed" && isCreator

  const handleDeleteClick = async () => {
    if (!window.confirm("Remove this record? This cannot be undone.")) {
      return
    }
    setIsDeleting(true)
    await deleteRecord(record._id, groupid)
    setIsDeleting(false)
  }

  const handleSettleClick = async () => {
    if (!window.confirm("Mark this record as paid and move it to history?")) {
      return
    }
    setIsSettling(true)
    await settleRecord(record._id, groupid)
    setIsSettling(false)
  }

  const handleConfirmClick = async () => {
    if (!window.confirm(`Confirm that you owe ${record.from.name} ₹${record.amount}?`)) {
      return
    }
    setIsConfirming(true)
    await updateRecord(record._id, record.to, record.amount, record.note, "confirmed", groupid)
    setIsConfirming(false)
  }

  const handleDeclineClick = async () => {
    if (!window.confirm("Decline this record? It will be removed.")) {
      return
    }
    setIsDeclining(true)
    await declineRecord(record._id, groupid)
    setIsDeclining(false)
  }

  const openEdit = () => {
    setEditAmount(record.amount)
    setEditNote(record.note)
    setIsEditing(true)
  }

  const handleEditSave = async () => {
    const amount = Number(editAmount)
    if (!Number.isFinite(amount) || amount <= 0 || !editNote.trim()) {
      return
    }
    if (!window.confirm("Save changes to this record?")) {
      return
    }
    setIsSavingEdit(true)
    // `to` is left undefined here on purpose - who the record is against
    // shouldn't change from an edit, only the amount/note.
    const success = await updateRecord(record._id, undefined, amount, editNote.trim(), undefined, groupid)
    setIsSavingEdit(false)
    if (success) {
      setIsEditing(false)
    }
  }

  return (
    <div className="container my-3 px-0">
      <div className={`card record-card ${isMine ? "own-record" : ""}`}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
            <h5 className="card-title mb-1">
              {`${record.to.name} \u2192 ${record.from.name}`}
            </h5>
            {isCreator && record.status === "pending" && !isEditing && (
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={openEdit}>
                <i className="bi bi-pencil"></i>
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="my-2">
              <div className="row g-2">
                <div className="col-5">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control form-control-sm"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                  />
                </div>
                <div className="col-7">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                  />
                </div>
              </div>
              <div className="d-flex gap-2 mt-2">
                <button className="btn btn-sm btn-primary" onClick={handleEditSave} disabled={isSavingEdit}>
                  {isSavingEdit ? "Saving..." : "Save"}
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="card-text mb-2">
              Amount: <span className="record-amount">₹{record.amount}</span> <br />
              Reason: {record.note} <br />
              Status: <span className={`badge ${record.status === "confirmed" ? "text-bg-success" : "text-bg-warning"}`}>{record.status}</span>
            </p>
          )}

          {record.status === "pending" && isRecipient &&
            (<div className="container my-2 px-0">
            <h6>You owe {`${record.from.name}`} ₹{`${record.amount}`}</h6>
            <h6>Is this right?</h6>
            <div className="container d-flex px-0 gap-2">
              <button type="button" className="btn btn-outline-success" onClick={handleConfirmClick} disabled={busy}>
                {isConfirming ? "Confirming..." : "Confirm"}
              </button>
              <button type="button" className="btn btn-outline-danger" onClick={handleDeclineClick} disabled={busy}>
                {isDeclining ? "Declining..." : "Decline"}
              </button>
            </div>
          </div>)}

          <div className="d-flex gap-2 mt-2">
            {canSettle && (
              <button className="btn btn-outline-success" onClick={handleSettleClick} disabled={busy}>
                {isSettling ? "Settling..." : "Done"}
              </button>
            )}
            {isCreator && record.status === "pending" && (
              <button className="btn btn-outline-danger" onClick={handleDeleteClick} disabled={busy}>
                {isDeleting ? "Removing..." : "Remove"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordItem;
