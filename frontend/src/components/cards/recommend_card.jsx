import React from "react";
import { Music2 } from "lucide-react";

const Cards = ({ items, cardType = "album" }) => {
  return (
    <div className="overflow-x-auto scrollbar-hide h-[280px] pt-3 w-full flex space-x-4 ">
      {items && items.length > 0 ? (
        items.map((item, index) => (
          <div key={item.id || index} className="card-style w-40 shrink-0 border-none">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-[60%] rounded-xl object-cover"
              />
            ) : (
              <div className="w-full h-[60%] rounded-xl bg-white/10 flex items-center justify-center ">
                <Music2 className="text-white/60" size={48} />
              </div>
            )}
            <h4 className="text-sm font-semibold mt-2 truncate text-white">
              {item.title || "Untitled"}
            </h4>
            <p className="text-xs text-white/60 truncate">
              {item.subtitle || "No subtitle"}
            </p>
          </div>
        ))
      ) : (
        <p className="text-white/60">No cards to display.</p>
      )}
    </div>
  );
};

export default Cards;
