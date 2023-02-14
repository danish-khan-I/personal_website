import { useState } from "react";
import Nav from "./components/Nav";

import { Divider } from "primereact/divider";
import Intro from "./components/Intro";
import Experience from "./components/Experience";

function App() {
  return (
    <div className="App">
      <Nav />
      <section id="intro" className="mt-8  section">
        <Intro />
      </section>
      <section
        id="experience"
        className=" section  border-solid border-top-1  border-none border-400"
      >
        <div className="container">
          {/* align-items-center */}
          <div className="grid ">
            <div className="col-4">
              <h2>Experience.</h2>
              <p>
                I partner with startups, organizations and Fortune 500 companies
                to build digital products that help clients overcome challenges
                and create lasting connections with millions of people every
                day.
              </p>
            </div>
            <div className="col-8">
              <Experience jobTitle={"Senior system analytics"} start="Jun-2021" company={"AlignTogether solutions pvt ltd"}  details={'Designed and developed user-friendly website, including optimized check-out page that increased user clicks, and subsequently customer purchases by 20%.'} />
              <Divider />
              <Experience jobTitle={"Senior system analytics"} start="Jun-2021" company={"AlignTogether solutions pvt ltd"}  details={'Designed and developed user-friendly website, including optimized check-out page that increased user clicks, and subsequently customer purchases by 20%.'} />
              <Divider />
              <Experience jobTitle={"Senior system analytics"} start="Jun-2021" company={"AlignTogether solutions pvt ltd"}  details={'Designed and developed user-friendly website, including optimized check-out page that increased user clicks, and subsequently customer purchases by 20%. Designed and developed user-friendly website, including optimized check-out page that increased user clicks, and subsequently customer purchases by 20%.'} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
