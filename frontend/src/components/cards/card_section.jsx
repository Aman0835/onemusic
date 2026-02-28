import React from "react";
import Cards from "./recommend_card";

const CardSection = ({ title, items }) => {
  if (!items || items.length === 0) {
    return "Nothing to show"; // Don't render the section if there are no items
  }

  return (
    <div className="mb-8">
      <h2 className="font-bold text-2xl text-white mb-4">{title}</h2>
      <Cards items={items} />
    </div>
  );
};

export default CardSection;
