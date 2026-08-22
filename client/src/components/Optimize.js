import React, { useEffect, useState } from "react";
import OpRecordItem from "./OpRecordItem";

// Balances this close to zero are treated as settled - avoids endless
// recursion caused by floating point residue (e.g. 0.00000000004).
const EPSILON = 0.01;

// Hard ceiling on recursion depth as a last-resort safety net. With N
// members the algorithm settles at most N-1 debts, so this is generous
// even for a very large group and guarantees we can never blow the call
// stack or loop forever on bad data.
const MAX_ITERATIONS = 1000;

const Optimize = (props) => {
  const { records } = props;

  const [opRecords, setOpRecords] = useState([]);

  const createNetBalance = (records) => {
    const netBalance = {};
    const members = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      if (!record || !record.to || !record.from) {
        continue;
      }
      if (record.status !== "confirmed") {
        continue;
      }

      const amount = Number(record.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        continue;
      }

      if (
        !members.some((m) => {
          return m.email === record.to.email;
        })
      ) {
        members.push({ email: record.to.email, name: record.to.name });
      }
      if (
        !members.some((m) => {
          return m.email === record.from.email;
        })
      ) {
        members.push({ email: record.from.email, name: record.from.name });
      }

      if (!netBalance[record.to.email]) {
        netBalance[record.to.email] = -amount;
      } else {
        netBalance[record.to.email] -= amount;
      }
      if (!netBalance[record.from.email]) {
        netBalance[record.from.email] = amount;
      } else {
        netBalance[record.from.email] += amount;
      }
    }

    return { netBalance, members };
  };

  const optimize = (opRecords, netBalance, members, iteration = 0) => {
    if (members.length === 0) {
      return opRecords;
    }
    // Safety net: never recurse past MAX_ITERATIONS, no matter what the
    // data looks like.
    if (iteration >= MAX_ITERATIONS) {
      return opRecords;
    }

    let min = Infinity;
    let max = -Infinity;

    let minEmail = null;
    let maxEmail = null;
    let minName = null;
    let maxName = null;

    for (let i = 0; i < members.length; i++) {
      const amount = netBalance[members[i].email] || 0;

      if (amount > max) {
        max = amount;
        maxEmail = members[i].email;
        maxName = members[i].name;
      }
      if (amount < min) {
        min = amount;
        minEmail = members[i].email;
        minName = members[i].name;
      }
    }

    // Everyone is settled (within epsilon) - we're done.
    if (Math.abs(max) < EPSILON && Math.abs(min) < EPSILON) {
      return opRecords;
    }
    // No one to net against (shouldn't normally happen, but guards
    // against an empty/degenerate members list).
    if (minEmail === null || maxEmail === null || minEmail === maxEmail) {
      return opRecords;
    }

    const settleAmount = parseFloat((-netBalance[minEmail]).toFixed(2));
    if (settleAmount > 0) {
      opRecords.push({
        from: { email: maxEmail, name: maxName },
        to: { email: minEmail, name: minName },
        amount: settleAmount,
      });
    }

    const newNetBalance = { ...netBalance };
    newNetBalance[maxEmail] = netBalance[maxEmail] + netBalance[minEmail];
    newNetBalance[minEmail] = 0;

    newNetBalance[minEmail] =
      Math.abs(newNetBalance[minEmail]) < EPSILON ? 0 : newNetBalance[minEmail];
    newNetBalance[maxEmail] =
      Math.abs(newNetBalance[maxEmail]) < EPSILON ? 0 : newNetBalance[maxEmail];

    return optimize(opRecords, newNetBalance, members, iteration + 1);
  };

  useEffect(() => {
    if (!records || records.length === 0) {
      setOpRecords([]);
      return;
    }

    try {
      const { netBalance, members } = createNetBalance(records);
      const optimized = optimize([], netBalance, members);
      setOpRecords(optimized);
    } catch (error) {
      // Optimization should never crash the page - fall back to no
      // suggestions rather than letting a bad record break rendering.
      console.error("Optimization failed:", error);
      setOpRecords([]);
    }
    // optimize/createNetBalance are pure functions redefined each render;
    // only the incoming records should re-trigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records]);

  return (
    <div>
      <button
        type="button"
        className="btn btn-outline-success my-2"
        data-bs-toggle="modal"
        data-bs-target="#optimize"
      >
        Optimize
      </button>

      <div
        className="modal fade"
        id="optimize"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="exampleModalLabel">
                Optimized Records
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              {opRecords.length === 0 ? (
                <p className="text-muted mb-0">Everyone is settled up - nothing to optimize.</p>
              ) : (
                opRecords.map((opRecord) => {
                  return (
                    <OpRecordItem
                      opRecord={opRecord}
                      key={`${opRecord.from.email}-${opRecord.to.email}`}
                    />
                  );
                })
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Optimize;
