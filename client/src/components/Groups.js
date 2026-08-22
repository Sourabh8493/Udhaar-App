import React, { useContext, useEffect, useState } from "react";
import GroupItem from "./GroupItem";
import GroupContext from "../context/GroupContext";
import { useNavigate } from "react-router-dom";
import CreateGroup from "./CreateGroup";

const Groups = () => {
  const groupContext = useContext(GroupContext);
  const { groups, getGroups, getUserDetails, currentUser } = groupContext;

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (localStorage.getItem("token")) {
        setIsLoading(true);
        await Promise.all([getGroups(), getUserDetails()]);
        setIsLoading(false);
      } else {
        navigate("/login");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container udhaar-page">
      <div className="udhaar-hero">
        <h2>{currentUser.name ? `Hi, ${currentUser.name.split(" ")[0]}` : "Welcome"}</h2>
        <p>Keep track of who owes what, split fairly, and settle up without the awkward math.</p>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="udhaar-section-title mb-0">Your groups</h4>
      </div>

      {isLoading ? (
        <div className="d-flex align-items-center gap-2 text-muted">
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          Loading your groups...
        </div>
      ) : (
        <div className="udhaar-group-grid">
          {groups.map((group) => (
            <GroupItem key={group._id} group={group} currentUser={currentUser} />
          ))}
          <button type="button" className="udhaar-create-tile" onClick={() => setShowCreate(true)}>
            <i className="bi bi-plus-circle"></i>
            New group
          </button>
        </div>
      )}

      <CreateGroup show={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
};

export default Groups;
