import React from "react";

const Experience = ({ jobTitle, company, start, end = "Present", details }) => {
  return (
    <div className="exp">
      <h4>{jobTitle}</h4>
      <p className="m-0">{company}</p>
      <p className="m-0">
        {start}-{end}
      </p>
      <div>
        <p>{details}</p>
      </div>
    </div>
  );
};

export default Experience;
