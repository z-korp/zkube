// src/components/PasswordProtected.jsx
import React, { useState } from "react";
import { Button } from "../elements/button";

interface PasswordProtectedProps {
  children: React.ReactNode;
  onSkip: () => void;
}

const PasswordProtected = ({ children, onSkip }: PasswordProtectedProps) => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const correctPassword = import.meta.env.VITE_TESTINGPAGE_PASSWORD;

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthenticated(true);
    } else {
      alert("Mot de passe incorrect !");
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full"
      >
        <h2 className="text-2xl font-bold mb-4 text-secondary">
          Entrez Password
        </h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-2 border rounded mb-4"
        />
        <div className="flex flex-col gap-4">
          <Button type="submit" className="w-full" variant={"outline"}>
            Enter
          </Button>
          <Button onClick={onSkip} className="w-full" variant={"outline"}>
            Back to prod mode
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PasswordProtected;
