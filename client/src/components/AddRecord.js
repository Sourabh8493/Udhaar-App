import React, { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import GroupContext from "../context/GroupContext";
import RecordContext from "../context/RecordContext";
import AlertContext from "../context/AlertContext";

const AddRecord = () => {
  const { groupid } = useParams();

  const { currentGroup, getGroup, currentUser, getUserDetails } = useContext(GroupContext);
  const { addRecord, addAllRecord } = useContext(RecordContext);
  const { showAlert } = useContext(AlertContext);

  const groupWithoutUser = (currentGroup.members || []).filter((member) => {
    return member.email !== currentUser.email;
  });

  // mode: "single" -> pick one person, "all" -> split with everyone,
  // "select" -> split with a chosen subset of the group.
  const [mode, setMode] = useState("single");
  const [record, setRecord] = useState({ to: "", amount: "", note: "" });
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [includeMe, setIncludeMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ref = useRef();

  const onChange = (e) => {
    setRecord({ ...record, [e.target.name]: e.target.value });
  };

  const toggleSelected = (email) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleAddClick = async () => {
    const amount = Number(record.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      showAlert("Enter an amount greater than 0", "danger");
      return;
    }
    if (!record.note.trim()) {
      showAlert("Please add a short note", "danger");
      return;
    }

    let success;
    setIsSubmitting(true);

    if (mode === "single") {
      if (!record.to) {
        showAlert("Please select who this record is for", "danger");
        setIsSubmitting(false);
        return;
      }
      success = await addRecord(record.to, amount, record.note.trim(), groupid);
    } else if (mode === "all") {
      success = await addAllRecord(groupWithoutUser, amount, record.note.trim(), groupid);
    } else {
      const chosen = groupWithoutUser.filter((m) => selectedEmails.includes(m.email));
      if (chosen.length === 0) {
        showAlert("Select at least one member to split with", "danger");
        setIsSubmitting(false);
        return;
      }
      success = await addAllRecord(chosen, amount, record.note.trim(), groupid, includeMe);
    }

    setIsSubmitting(false);

    if (success) {
      setRecord({ to: "", amount: "", note: "" });
      setSelectedEmails([]);
      setIncludeMe(true);
      setMode("single");
      ref.current.click();
    }
  };

  useEffect(() => {
    getGroup(groupid);
    getUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupid]);

  return (
    <div>
      <button
        type="button"
        className="btn btn-primary"
        data-bs-toggle="modal"
        data-bs-target="#exampleModal"
      >
        <i className="bi bi-plus-lg me-1"></i>
        Add record
      </button>

      <div
        className="modal fade"
        id="exampleModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="exampleModalLabel">
                Add Record
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <h6 className="form-label">Split with</h6>
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${mode === "single" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setMode("single")}
                  >
                    One person
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${mode === "select" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setMode("select")}
                  >
                    Select members
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${mode === "all" ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setMode("all")}
                  >
                    Everyone
                  </button>
                </div>
              </div>

              {mode === "single" && (
                <div className="mb-3">
                  <label htmlFor="to" className="form-label">To</label>
                  <select
                    className="form-select"
                    onChange={onChange}
                    name="to"
                    value={record.to}
                  >
                    <option value="" disabled>Select a member</option>
                    {groupWithoutUser.map((memberDetails) => (
                      <option value={memberDetails.email} key={memberDetails.email}>
                        {memberDetails.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {mode === "select" && (
                <div className="mb-3">
                  <label className="form-label">Split with</label>
                  {groupWithoutUser.length === 0 ? (
                    <p className="text-muted small">No other members in this group yet.</p>
                  ) : (
                    groupWithoutUser.map((m) => (
                      <div className="form-check" key={m.email}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`select-${m.email}`}
                          checked={selectedEmails.includes(m.email)}
                          onChange={() => toggleSelected(m.email)}
                        />
                        <label className="form-check-label" htmlFor={`select-${m.email}`}>
                          {m.name}
                        </label>
                      </div>
                    ))
                  )}
                  <div className="form-check mt-3 pt-2 border-top">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="includeMe"
                      checked={includeMe}
                      onChange={(e) => setIncludeMe(e.target.checked)}
                    />
                    <label className="form-check-label fw-medium" htmlFor="includeMe">
                      Include Me
                    </label>
                  </div>

                  <div className="form-text">
                    {includeMe
                      ? "The amount will be split evenly between you and everyone selected."
                      : "The amount will be split evenly between selected members only (excluding you)."}
                  </div>
                </div>
              )}

              {mode === "all" && (
                <div className="form-text mb-3">
                  The amount will be split evenly between you and all {groupWithoutUser.length} other member{groupWithoutUser.length !== 1 ? "s" : ""}.
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="amount" className="form-label">
                  {mode === "single" ? "Amount" : "Total amount"}
                </label>
                <input
                  className="form-control"
                  type="number"
                  step="0.01"
                  min="0.01"
                  id="amount"
                  onChange={onChange}
                  name="amount"
                  value={record.amount}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="note" className="form-label">Note</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Enter the reason"
                  id="note"
                  onChange={onChange}
                  name="note"
                  value={record.note}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                ref={ref}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddClick}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Adding...
                  </>
                ) : (
                  "Add"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRecord;
