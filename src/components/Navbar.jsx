import React from "react";
import { Link } from "react-router-dom";
import { Search, Heart, ShoppingBag, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Navbar() {
  return (
    <>
      <div className="bg-[#FFF8EF] h-20 flex items-center justify-between px-10">
        <div className="text-2xl font-normal font-serif tracking-wide">
          <h1>
            <span className="text-[#C62828] font-bold">S</span>nack
            <span className="text-[#C62828] font-bold">S</span>top
          </h1>
          <h1 className="text-xs">Imported snacks</h1>
        </div>
        <div className="flex gap-10 text-lg font-normal font-serif tracking-wide">
          <Link to="/" className="active:text-[#C62828] font-medium">Home</Link>
          <Link to="/shop" className="active:text-[#C62828] font-medium">Shop</Link>
          <Link to="/about" className="active:text-[#C62828] font-medium">About</Link>
          <Link to="/contact" className="active:text-[#C62828] font-medium">Contact</Link>
          <Link to="/cart" className="active:text-[#C62828] font-medium">   <ShoppingBag className="cursor-pointer" /></Link>
        </div>
      </div>
    </>
  );
}

export default Navbar;
