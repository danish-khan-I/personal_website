import React from "react";
import { Avatar } from "primereact/avatar";
import { Chip } from "primereact/chip";
import { useNavigate } from "react-router-dom";

const BlogCard = () => {
  const navigate = useNavigate();
  return (
    <div className="grid">
      <div className="col-12">
        <div className="flex align-items-center">
          <Avatar
            image="https://www.gravatar.com/avatar/05dfd4b41340d09cae045235eb0893c3?d=mp"
            shape="circle"
          />
          <h3 className="m-0 ml-2">Danish Khan</h3>
        </div>
        <a href="/blog/" className="hidden">
          An earthquake, an emergency, and endless trauma
        </a>
        <h1 className="m-0 pt-2" onClick={() => navigate("/blog/12")}>
          An earthquake, an emergency, and endless trauma
        </h1>
        <p className="m-0 pt-2">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Magnam,
          voluptate repudiandae id, blanditiis iure facere incidunt modi sed
          sequi possimus exercitationem! Illo ut eos quod error consectetur
          atque ad minus? Quaerat minima aut modi corporis fugit nostrum
          voluptates qui voluptate, mollitia voluptatum eligendi hic ullam sit
          rerum? Eius quas necessitatibus culpa quod, reprehenderit natus error
          rem eaque nam dolores corrupti sed excepturi modi, quos fugiat vero
          nisi at amet! Culpa deserunt, omnis enim dolore minima tempore,
          consequuntur praesentium facere quos voluptatibus exercitationem
          corrupti optio reprehenderit ea. Officia voluptatem vero suscipit! Non
          voluptate eius explicabo. Aspernatur tempora distinctio laudantium
          mollitia provident!
        </p>
        <div className="opacity-8 flex gap-2 align-items-center text-xs mt-1">
          <span>Feb-23</span>
          <span className="">·</span>
          <span>5 min read</span>
          <span className="">·</span>

          <Chip label="Action" className="text-xs" />
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
