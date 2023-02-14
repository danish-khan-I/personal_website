import React from "react";
import { Menubar } from "primereact/menubar";
import { Button } from "primereact/button";

const Nav = () => {
  return (
    <div className="card fixed top-0 left-0 w-full  shadow-1 z-5">
      <div className="container">
        <div className="flex justify-content-between align-items-center gap-1">
          <div>
            <h3>Danish.</h3>
          </div>
          <div>
            <Button
              label="Skills"
              className="p-button-secondary p-button-text mx-1"
            />
            <Button
              label="Experience"
              className="p-button-secondary p-button-text mx-1"
            />
            <Button
              label="Portofolio"
              className="p-button-secondary p-button-text mx-1"
            />
            <Button
              label="My Blog"
              className="p-button-success p-button-text mx-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nav;
