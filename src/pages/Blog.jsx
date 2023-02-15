import BlogCard from "@/components/BlogCard";
import Nav from "@/components/Nav";
import { Divider } from "primereact/divider";
import React from "react";

const Blog = () => {
  return (
    <>
      <Nav />
      <section id="blogs" className="mt-8  section w-6 m-auto">
        <BlogCard />
        <Divider />
        <BlogCard />
        <Divider />
        <BlogCard />
        <Divider />
        <BlogCard />
      </section>
    </>
  );
};

export default Blog;
