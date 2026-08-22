import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import RecordItem from "./RecordItem";
import RecordContext from "../context/RecordContext";
import { useNavigate, useParams, Link } from "react-router-dom";
import GroupContext from "../context/GroupContext";
import AddRecord from "./AddRecord";
import Optimize from "./Optimize";

const Records = () => {
  const recordContext = useContext(RecordContext);
  const { records, getRecords } = recordContext;

  const { leaveGroup, addMember, currentGroup, getGroup, getUserDetails, currentUser } =
    useContext(GroupContext);

  const navigate = useNavigate();

  const { groupid } = useParams();

  const [memberEmail, setMemberEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "mine"

  const ref = useRef();

  const handleBackClick = () => {
    navigate("/");
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm("Leave this group? You'll need to be re-invited to rejoin.")) {
      return;
    }
    setIsLeaving(true);
    const success = await leaveGroup(groupid);
    setIsLeaving(false);
    if (success) {
      navigate("/");
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim()) {
      return;
    }
    setIsAddingMember(true);
    const success = await addMember(memberEmail.trim(), groupid);
    setIsAddingMember(false);
    if (success) {
      setMemberEmail("");
      ref.current.click();
    }
  };

  const onChange = (e) => {
    setMemberEmail(e.target.value);
  };

  useEffect(() => {
    const load = async () => {
      if (localStorage.getItem("token")) {
        setIsLoading(true);
        await Promise.all([getRecords(groupid), getUserDetails(), getGroup(groupid)]);
        setIsLoading(false);
      } else {
        navigate("/login");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupid]);

  // "My records" - anything where the logged-in user is either side of
  // the debt. Filtered client-side since we already have the full list
  // loaded, so there's no need for a second API call.
  const visibleRecords = useMemo(() => {
    const sorted = [...records].reverse();
    if (filter === "mine" && currentUser.email) {
      return sorted.filter(
        (r) => r.from.email === currentUser.email || r.to.email === currentUser.email
      );
    }
    return sorted;
  }, [records, filter, currentUser.email]);

  return (
    <div>
      <div className="container udhaar-page">
        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={handleBackClick}
          >
            <i className="bi bi-arrow-left"></i>
          </button>
          <h2 className="udhaar-section-title mb-0">{currentGroup.title || "Group Records"}</h2>
        </div>

        <div className="container my-2 px-0 d-flex flex-wrap gap-2 align-items-center">
          <AddRecord />
          <Optimize records={records} />
          <button
            type="button"
            className="btn btn-outline-primary"
            data-bs-toggle="modal"
            data-bs-target="#exampleModal2"
          >
            <i className="bi bi-person-plus me-1"></i>
            Add member
          </button>
          <Link to={`/groups/${groupid}/history`} className="btn btn-outline-secondary">
            <i className="bi bi-clock-history me-1"></i>
            History
          </Link>
          <button
            type="button"
            className="btn btn-outline-danger ms-auto"
            onClick={handleLeaveGroup}
            disabled={isLeaving}
          >
            {isLeaving ? "Leaving..." : "Leave Group"}
          </button>

          <div
            className="modal fade"
            id="exampleModal2"
            tabIndex="-1"
            aria-labelledby="exampleModalLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h1 className="modal-title fs-5" id="exampleModalLabel">
                    Add Member
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
                    <label
                      htmlFor="exampleFormControlInput1"
                      className="form-label"
                    >
                      Enter email of member
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="exampleFormControlInput1"
                      placeholder="name@example.com"
                      value={memberEmail}
                      onChange={onChange}
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
                    onClick={handleAddMember}
                    disabled={isAddingMember}
                  >
                    {isAddingMember ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2 mt-3 mb-3">
          <button
            type="button"
            className={`udhaar-tab-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All records
          </button>
          <button
            type="button"
            className={`udhaar-tab-btn ${filter === "mine" ? "active" : ""}`}
            onClick={() => setFilter("mine")}
          >
            My records
          </button>
        </div>

        {isLoading ? (
          <div className="d-flex align-items-center gap-2 text-muted mt-3">
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Loading records...
          </div>
        ) : visibleRecords.length === 0 ? (
          <div className="udhaar-empty-state">
            <i className="bi bi-receipt"></i>
            {filter === "mine" ? "You have no records in this group." : "No records yet. Add one to get started."}
          </div>
        ) : (
          visibleRecords.map((record) => {
            return <RecordItem record={record} key={record._id} />;
          })
        )}
      </div>
    </div>
  );
};

export default Records;
