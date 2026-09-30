import React from "react";
import { Link } from "react-router-dom";

export const ResultAdBanner = ({ src, alt, to }) => {
  return (
    <Link
      to={to}
      className="no-print block overflow-hidden rounded-2xl shadow-xs"
    >
      <img src={src} alt={alt} className="block w-full h-auto" />
    </Link>
  );
};
