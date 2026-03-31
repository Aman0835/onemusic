import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useDispatch } from "react-redux";
import axios from "axios";
import Button from "../Login/Button";
import { removeUser } from "../utils/UserSlice";

import { API_BASE } from "../../api/config";
import { removeToken } from "../../api/auth";
const AUTH_API_BASE = API_BASE + "/api/auth";

const Logout = ({ iconOnly }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post(
        AUTH_API_BASE + "/logout",
        {},
      );
      removeToken();
      dispatch(removeUser());
      navigate("/home");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {iconOnly ? (
        <button
          className="w-9 h-9 bg-green-600 rounded-full text-white flex items-center justify-center hover:bg-green-700 transition"
          onClick={() => setShowModal(true)}>
          <LogOut size={18} />
        </button>
      ) : (
        <Button text="Logout" onClick={() => setShowModal(true)} />
      )}

      {showModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-white w-80 p-6 rounded-xl shadow-xl text-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Confirm Logout
              </h2>
              <p className="text-gray-600 mt-2">
                Are you sure you want to logout?
              </p>

              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400">
                  Cancel
                </button>

                <button
                  onClick={() => {
                    handleLogout();
                    setShowModal(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Logout
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default Logout;
