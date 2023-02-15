import { Button } from "primereact/button";
import React from "react";
import pic from "../assets/pic.jpg";
import { Inplace, InplaceDisplay, InplaceContent } from "primereact/inplace";

const Intro = () => {
  const redirect = (link) => () => {
    window.open(link, "_blank");
  };
  return (
    <div className="container">
      <div className="grid">
        <div className="col-12 md:col-6">
          <h1>I am Danish.</h1>
          <h4>
          Creative Developer with 4+ years designing useful, approachable user interfaces and user experiences. Knowledgeable on all aspects of best practices and emerging UI development techniques. Detail-oriented, organised and meticulous employee. Works at a fast pace to meet tight deadlines
          </h4>
          <div className="grid align-items-center">
            <div className="col-2">Phone</div>
            <div className="col-10">
              <Inplace>
                <InplaceDisplay className="p-0 cursor-pointer	">
                  click to view
                </InplaceDisplay>
                <InplaceContent>
                  <a href="tel:+919340917569" className="text-primary">+91 93409-17569</a>
                </InplaceContent>
              </Inplace>
            </div>

            <div className="col-2">Email</div>
            <div className="col-10">
              <Inplace>
                <InplaceDisplay className="p-0 cursor-pointer	">
                  click to view
                </InplaceDisplay>
                <InplaceContent>
                  <a href="mailto:dkhan9591@gmail.com?subject=Hi Danish, We would like to ..&body=Hi Danish" className="text-primary">
                    dkhan9591@gmail.com
                  </a>
                </InplaceContent>
              </Inplace>
            </div>

            <div className="col-2">Address</div>
            <div className="col-10">Bhopal, MP, India</div>

            <div className="col-2">Social</div>
            <div className="col-10">
              <Button
                icon="pi pi-github"
                className=" p-button-rounded p-button-text"
                aria-label="github"
                aria-hidden="true"
                onClick={redirect("https://github.com/danish-khan-I")}
              />
              <Button
                icon="pi pi-instagram"
                className=" p-button-rounded p-button-text"
                aria-label="instagram"
                aria-hidden="true"
                onClick={redirect("https://www.instagram.com/mr__complicated/")}
              />

              <Button
                icon="pi pi-linkedin"
                className=" p-button-rounded p-button-text"
                aria-label="linkedin"
                aria-hidden="true"
                onClick={redirect("https://www.linkedin.com/in/danish-khan-i/")}
              />

              <Button
                icon="pi pi-twitter"
                className=" p-button-rounded p-button-text"
                aria-label="twitter"
                aria-hidden="true"
                onClick={redirect("https://twitter.com/mr__complicated")}
              />
            </div>
            <div className="col-12">
              <Button
                label="CONTACT ME"
                className="mr-3 "
                color="primary"
              ></Button>
              <Button
                label="DOWNLOAD CV"
                className="p-button-secondary  p-button-outlined"
              />
            </div>
          </div>
        </div>
        <div className="col-12 md:col-6 align-self-center hidden md:block">
          <img src={pic} alt="" className="w-full" />
        </div>
      </div>
    </div>
  );
};

export default Intro;
