import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import RecordContext from "../context/RecordContext";
import GroupContext from "../context/GroupContext";
import { isSessionValid, clearAuthSession } from "../utils/api";

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const History = () => {
  const navigate = useNavigate();
  const { groupid } = useParams();
  const { history, getHistory } = useContext(RecordContext);
  const { currentGroup, getGroup } = useContext(GroupContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!isSessionValid()) {
        clearAuthSession();
        navigate("/login");
        return;
      }
      setIsLoading(true);
      try {
        await Promise.all([getHistory(groupid), getGroup(groupid)]);
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupid]);

  return (
    <div className="container udhaar-page">
      <div className="d-flex align-items-center gap-2 mb-3">
        <Link to={`/groups/${groupid}`} className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left"></i>
        </Link>
        <h2 className="udhaar-section-title mb-0">
          {currentGroup.title ? `${currentGroup.title} — History` : "History"}
        </h2>
      </div>
      <p className="udhaar-subtitle">
        A read-only record of everything that's been settled in this group. Declined or removed
        records don't show up here.
      </p>

      {isLoading ? (
        <div className="d-flex align-items-center gap-2 text-muted">
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          Loading history...
        </div>
      ) : history.length === 0 ? (
        <div className="udhaar-empty-state">
          <i className="bi bi-clock-history"></i>
          Nothing settled yet in this group.
        </div>
      ) : (
        <div className="mt-3">
          {history.map((item) => (
            <div className="udhaar-history-item" key={item._id}>
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-1">
                <div>
                  {/* record.to owes record.from (the creator) - so it's
                      "to" who actually paid "from" when this was settled. */}
                  <strong>{item.to.name}</strong> paid <strong>{item.from.name}</strong>
                  <div className="text-muted small">{item.note}</div>
                </div>
                <span className="record-amount owed">₹{item.amount}</span>
              </div>
              <div className="text-muted small mt-1">
                Created {formatDate(item.createdDate)} · Settled {formatDate(item.settledDate)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
