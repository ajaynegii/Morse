"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast" // For toast notifications

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, mobileNumber: string, userId: string) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true); // true for login, false for signup
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const method = "POST";
    const body = JSON.stringify({ mobileNumber, password });

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, { // UPDATED: Use localhost
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      const data = await response.json();

      if (response.ok) {
        onAuthSuccess(data.token, data.mobileNumber, data._id);
        toast({
          title: "Success",
          description: isLogin ? "Logged in successfully!" : "Account created successfully!",
          variant: "default",
        });
        onClose(); // Close modal on success
      } else {
        toast({
          title: "Error",
          description: data.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Network Error",
        description: "Could not connect to the server. Is the backend running?",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isLogin ? "Sign In" : "Sign Up"}</DialogTitle>
          <DialogDescription>
            {isLogin ? "Enter your mobile number and password to access your chat." : "Create a new account with your mobile number."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mobileNumber" className="text-right">
                Mobile No.
              </Label>
              <Input
                id="mobileNumber"
                type="tel" // Use type="tel" for mobile numbers
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
                className="col-span-3"
                placeholder="e.g., 9876543210"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (isLogin ? "Signing In..." : "Signing Up...") : (isLogin ? "Sign In" : "Sign Up")}
            </Button>
          </DialogFooter>
        </form>
        <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="w-full mt-2">
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </Button>
      </DialogContent>
    </Dialog>
  );
} 