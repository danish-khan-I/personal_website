import React from "react";
import { Divider } from "primereact/divider";
import Intro from "@/components/Intro";
import Experience from "@/components/Experience";
import Lines from "@/components/Lines";
import Nav from "@/components/Nav";

const Home = () => {
  return (
    <>
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
          <div className="grid align-items-baseline relative">
            <Lines />
            <div className="col-12 md:col-4 fadeinleft">
              <h2>Experience.</h2>
              <p>
                I partner with startups, organizations and Fortune 4+ companies
                to build digital products that help clients overcome challenges
                and create lasting connections with millions of people every
                day.
              </p>
            </div>
            <div className=" col-12 md:col-8">
              <Experience
                jobTitle={"Lead Full Stack Developer"}
                start="Feb-2022"
                company={"Hacking Lymen Pvt Ltd"}
                details={
                  <ul>
                    <li>
                      Designed and developed user-friendly website, including
                      optimized check-out page that increased user clicks, and
                      subsequently customer purchases by 20%.
                    </li>
                    <li>
                      Worked on backend & frontend with ReactJS ,VueJS, Laravel
                      and Node.
                    </li>
                    <li>
                      Provided software application engineering and maintenance
                      for development lifecycle.
                    </li>
                    <li>
                      Delivered performance-driven and user-centric websites
                      that met all business requirements.
                    </li>
                  </ul>
                }
              />
              <Divider />
              <Experience
                jobTitle={"Senior System Analyst"}
                start="May-2020"
                end="Jan-2022"
                company={"AlignTogether Solutions Pvt Ltd"}
                details={
                  <ul>
                    <li>
                      Created internal product AlignTogether.live with 2-5
                      developers. lead the product development backend &
                      frontend. build architecture and configured with thrid
                      party products to met the requirements.
                    </li>
                    <li>
                      Reviewed code, debugged problems, corrected issues and
                      improved performance over 40%.
                    </li>
                    <li>
                      Managed development milestones from initial steps through
                      final delivery.
                    </li>
                    <li>
                      Updated old code bases to modern development standards,
                      improving functionality, implemented lazy load and
                      replaced image with WebP improving performance over 30%.
                    </li>
                    <li>
                      Mentored junior members and delivered training to boost
                      team skills set
                    </li>
                    <li>
                      Boosted network, system and data availability and
                      integrity through preventive maintenance and upgrades.
                    </li>
                  </ul>
                }
              />
              <Divider />
              <Experience
                jobTitle={"PHP Developer"}
                start="Nov-2018"
                end="May-2020"
                company={"HackerKernel"}
                details={
                  <ul>
                    <li>
                      Developed back-end components to connect applications with
                      web services{" "}
                    </li>
                    <li>
                      Wrote server-side and client-side code for projects using
                      PHP, Laravel, HTML, CSS and jQuery
                    </li>
                    <li>
                      Performed troubleshooting of technical issues within
                      production environment
                    </li>
                    {/* <li>Delivered on 10+ projects and .</li> */}
                    <li>
                      Responsible for supporting existing applications,
                      developing new features for existing applications, and
                      developing new web-based applications.
                    </li>
                  </ul>
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section
        id="education"
        className=" section  border-solid border-top-1  border-none border-400"
      >
        <div className="container">
          {/* align-items-center */}
          <div className="grid relative align-items-baseline">
            <Lines />
            <div className="col-12 md:col-4">
              <h2>Education.</h2>
              <p>
                All my life I have been driven by my strong belief that
                education is important. I try to learn something new every
                single day.
              </p>
            </div>
            <div className="col-12 md:col-8">
            <Experience
                jobTitle={"AlgoExpert.io System Design"}
                start="Aug-2022"
                company={"Algoexpert"}
                details={"Learning system design expert."}
              />
              <Divider />
              <Experience
                jobTitle={"AlgoExpert.io training"}
                start="Aug-2022"
                company={"Algoexpert"}
                details={"Learning and solving algorithms on the platform."}
              />
              <Divider />
              <Experience
                jobTitle={"Bachelors in computer applications"}
                start="Mar-2017"
                end="Mar-2020"
                company={"Saifia Science College"}
                details={
                  "Done Bachelors in Computer Applications. while pursing college degree I've given classes on web development to another college"
                }
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
