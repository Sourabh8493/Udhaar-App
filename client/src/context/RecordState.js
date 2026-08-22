import React, { useContext, useState } from "react";
import RecordContext from "./RecordContext";
import AlertContext from "./AlertContext";
import { apiRequest } from "../utils/api";

const RecordState = (props) => {
  const recordsInitial = [];
  const [records, setRecords] = useState(recordsInitial);
  const [history, setHistory] = useState([]);

  const alertContext = useContext(AlertContext);
  const showAlert = alertContext ? alertContext.showAlert : () => {};

  const getHistory = async (groupid) => {
    try {
      const json = await apiRequest(`/api/records/history/${groupid}`);
      setHistory(Array.isArray(json) ? json : []);
    } catch (error) {
      showAlert(error.message, "danger");
    }
  };

  const settleRecord = async (id, groupid) => {
    try {
      await apiRequest(`/api/records/settlerecord/${id}`, { method: "PUT" });
      await getRecords(groupid);
      showAlert("Marked as done!", "success");
      return true;
    } catch (error) {
      showAlert(error.message, "danger");
      return false;
    }
  };

  const getRecords = async (groupid) => {
    try {
      const json = await apiRequest(`/api/records/fetchallrecords/${groupid}`);
      setRecords(Array.isArray(json) ? json : []);
    } catch (error) {
      showAlert(error.message, "danger");
    }
  };

  const deleteRecord = async (id, groupid) => {
    try {
      await apiRequest(`/api/records/deleterecord/${id}`, { method: "DELETE" });
      await getRecords(groupid);
      showAlert("Record removed", "success");
      return true;
    } catch (error) {
      showAlert(error.message, "danger");
      return false;
    }
  };

  const declineRecord = async (id, groupid) => {
    try {
      await apiRequest(`/api/records/declinerecord/${id}`, { method: "DELETE" });
      await getRecords(groupid);
      showAlert("Record declined", "success");
      return true;
    } catch (error) {
      showAlert(error.message, "danger");
      return false;
    }
  };

  const addRecord = async (to, amount, note, groupid) => {
    try {
      await apiRequest("/api/records/addrecord", {
        method: "POST",
        body: { to, amount, note, groupid },
      });
      await getRecords(groupid);
      return true;
    } catch (error) {
      showAlert(error.message, "danger");
      return false;
    }
  };

  const addAllRecord = async (members, amount, note, groupid) => {
    if (!members || members.length === 0) {
      showAlert("This group has no other members to split with", "danger");
      return false;
    }

    // Split evenly between the payer and every other member
    const splitAmount = amount / (members.length + 1);
    const roundedAmount = Math.round(splitAmount * 100) / 100;

    if (!(roundedAmount > 0)) {
      showAlert("Amount is too small to split", "danger");
      return false;
    }

    try {
      for (let i = 0; i < members.length; i++) {
        await addRecord(members[i].email, roundedAmount, note, groupid);
      }
      await getRecords(groupid);
      showAlert("Record added successfully!", "success");
      return true;
    } catch (error) {
      showAlert(error.message, "danger");
      return false;
    }
  };

  const updateRecord = async (id, to, amount, note, status, groupid) => {
    try {
      await apiRequest(`/api/records/updaterecord/${id}`, {
        method: "PUT",
        body: { to, amount, note, status },
      });
      await getRecords(groupid);
      showAlert(status === "confirmed" ? "Record confirmed!" : "Record updated", "success");
      return true;
    } catch (error) {
      showAlert(error.message, "danger");
      return false;
    }
  };

  return (
    <RecordContext.Provider
      value={{ records, getRecords, deleteRecord, addRecord, updateRecord, declineRecord, addAllRecord, settleRecord, history, getHistory }}
    >
      {props.children}
    </RecordContext.Provider>
  );
};

export default RecordState;
