import React, { useContext } from "react";
import MembersContext from "../context/MembersContext";

const AddMember = (props) => {
  const { members, setMembers } = useContext(MembersContext);

  const handleCrossClick = () => {
    const newMembers = members.toSpliced(props.index, 1);
    setMembers(newMembers);
  };

  const onChange = (e) => {
    const newMembers = members.with(props.index, e.target.value)
    setMembers(newMembers)
  }

  return (
    <div className="container my-1 d-flex">
      <input
        type="email"
        className="form-control"
        id={`member-${props.index}`}
        placeholder="name@example.com"
        value={members[props.index] || ""}
        onChange={onChange}
      />
      <button type="button" className="btn btn-danger" onClick={handleCrossClick}>
        X
      </button>
    </div>
  );
};

export default AddMember;
