import React from "react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div className="w-full max-w-md mx-4 p-6 rounded-lg" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)" }}>
        <div className="flex mb-4 gap-2 items-center">
          <div className="h-8 w-8 flex items-center justify-center rounded-full bg-red-500 text-white font-bold">!</div>
          <h1 className="text-2xl font-bold text-white">404 Page Not Found</h1>
        </div>

        <p className="mt-4 text-sm text-gray-200">
          Please return to the <a href="/" className="text-blue-300 hover:text-blue-200">main menu</a>.
        </p>
      </div>
    </div>
  );
}
