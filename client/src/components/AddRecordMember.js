import React from "react";

const AddRecordMember = (props) => {
  const {email, name} = props
  return <option value={`${email}`}>{name}</option>;
};

export default AddRecordMember;
