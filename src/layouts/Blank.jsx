import React from 'react'
import { Link } from 'react-router-dom'
import Footer from "./Footer";

export const Blank = ({ children }) => {
  return (
    <>
      <Link aria-label="Go to Home Page" to="/">
        {children}
      </Link>
    </>
  );
};
