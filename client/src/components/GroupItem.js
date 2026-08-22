import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupContext from "../context/GroupContext";

const GroupItem = (props) => {
  const { group } = props;
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(group.title);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const {deleteGroup, updateGroup} = useContext(GroupContext)

  const handleClick = () => {
    navigate(`/groups/${group._id}`);
  };

  const handleDeleteGroupClick = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${group.title}"? This cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    await deleteGroup(group._id)
    setIsDeleting(false);
  }

  const handleEditClick = (e) => {
    e.stopPropagation();
    setEditTitle(group.title);
    setIsEditing(true);
  }

  const handleEditSave = async (e) => {
    e.stopPropagation();
    if (!editTitle.trim() || editTitle.trim() === group.title) {
      setIsEditing(false);
      return;
    }
    if (!window.confirm("Save changes to this group's name?")) {
      return;
    }
    setIsSavingEdit(true);
    const success = await updateGroup(group._id, editTitle.trim());
    setIsSavingEdit(false);
    if (success) {
      setIsEditing(false);
    }
  }

  const isAdmin = props.currentUser && props.currentUser._id === group.user;
  const memberCount = (group.members || []).length;

  return (
    <div className="card udhaar-group-card udhaar-clickable-card" onClick={handleClick}>
      <div className="d-flex justify-content-between align-items-start">
        <div className="udhaar-group-icon">
          <i className="bi bi-people"></i>
        </div>
        {isAdmin && (
          <div className="dropdown" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="btn btn-sm btn-light border-0"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bi bi-three-dots-vertical"></i>
            </button>
            <ul className="dropdown-menu">
              <li>
                <button className="dropdown-item" onClick={handleEditClick}>
                  <i className="bi bi-pencil me-2"></i>Rename group
                </button>
              </li>
              <li>
                <button className="dropdown-item text-danger" onClick={handleDeleteGroupClick} disabled={isDeleting}>
                  <i className="bi bi-trash me-2"></i>{isDeleting ? "Deleting..." : "Delete group"}
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="d-flex gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            className="form-control form-control-sm"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            autoFocus
          />
          <button className="btn btn-sm btn-primary" onClick={handleEditSave} disabled={isSavingEdit}>
            <i className="bi bi-check-lg"></i>
          </button>
          <button className="btn btn-sm btn-outline-secondary" onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      ) : (
        <h5 className="udhaar-group-title mt-1">{group.title}</h5>
      )}

      <div className="udhaar-group-meta">
        <i className="bi bi-person-fill me-1"></i>
        {memberCount} member{memberCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

export default GroupItem;
