import React, { useState } from "react";
import { Menubar } from "primereact/menubar";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { InputSwitch } from "primereact/inputswitch";

const Nav = () => {
  const navigate = useNavigate();
  const [isDarkTheme, setTheme] = useState(true);
  const changeTheme = () => {
    setTheme((prev) => !prev);

    const html = document.querySelector("html");
    if (html.classList.contains("light")) {
      html.classList.remove("light");
    } else {
      html.classList.add("light");
    }
  };
  return (
    <div className="card fixed top-0 left-0 w-full  shadow-1 z-5 header">
      <div className="container">
        <div className="flex justify-content-between align-items-center gap-1">
          <div>
            <h3 onClick={() => navigate("/")} className="cursor-pointer">
              Danish.
            </h3>
          </div>
          <div>
            {/* <Button
              label="Skills"
              className="p-button-secondary p-button-text mx-1"
            /> */}
            <Button
              label="Experience"
              className="p-button-secondary p-button-text mx-1 hidden md:inline-flex"
            />
            <Button
              label="Education"
              className="p-button-secondary p-button-text mx-1  hidden md:inline-flex"
            />
            <Button
              label="My Blog"
              className="p-button-success p-button-text mx-1 vertical-align-sup"
              onClick={() => navigate("/blog")}
            />
            <InputSwitch checked={isDarkTheme} onChange={changeTheme} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Nav;
