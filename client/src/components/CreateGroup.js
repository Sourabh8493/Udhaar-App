import React, { useContext, useEffect, useRef, useState } from "react";
import AddMember from "./AddMember";
import MembersContext from "../context/MembersContext";
import GroupContext from "../context/GroupContext";
import AlertContext from "../context/AlertContext";

// Controlled from the outside via the `show` prop (the "+ New group" tile
// on the dashboard toggles it) using Bootstrap's own JS Modal API -
// window.bootstrap is already available globally since bootstrap.bundle.js
// is loaded via a <script> tag in public/index.html.
const CreateGroup = ({ show, onClose }) => {
  const {members, setMembers} = useContext(MembersContext)
  const {createGroup} = useContext(GroupContext)
  const {showAlert} = useContext(AlertContext)

  const modalRef = useRef(null)
  const modalInstance = useRef(null)

  const [title, setTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const modalEl = modalRef.current
    if (window.bootstrap && modalEl) {
      modalInstance.current = window.bootstrap.Modal.getOrCreateInstance(modalEl)
      modalEl.addEventListener("hidden.bs.modal", onClose)
    }
    return () => {
      if (modalEl) {
        modalEl.removeEventListener("hidden.bs.modal", onClose)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!modalInstance.current) return
    if (show) {
      modalInstance.current.show()
    } else {
      modalInstance.current.hide()
    }
  }, [show])

  const handlePlusClick = () => {
    setMembers([...members, ""])
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      showAlert("Please give your group a title", "danger")
      return
    }

    const newMembers = members.filter(member => member.trim() !== "")

    setIsSubmitting(true)
    const success = await createGroup(title.trim(), newMembers)
    setIsSubmitting(false)

    if (success) {
      setTitle("")
      setMembers([""])
      onClose()
    }
  }

  const onChangeTitle = (e) => {
    setTitle(e.target.value)
  }

  return (
    <div
      className="modal fade"
      id="createGroupModal"
      tabIndex="-1"
      aria-labelledby="createGroupModalLabel"
      aria-hidden="true"
      ref={modalRef}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5" id="createGroupModalLabel">
              Create Group
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
              <label htmlFor="title" className="form-label">
                Title
              </label>
              <input
                type="text"
                className="form-control"
                id="title"
                name="title"
                placeholder="Give your group a title"
                value={title}
                onChange={onChangeTitle}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">
                Add members
              </label>
              {members.map((member, index) => {
                return <AddMember index={index} key={index}/>
              })}
            </div>
            <button type="button" className="btn btn-secondary" onClick={handlePlusClick}>+</button>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;
