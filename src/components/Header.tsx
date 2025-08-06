import { Button } from "@/components/ui/button";
import { PenTool, Menu } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { LoginForm } from "@/pages/Login";
import { SignupForm } from "@/pages/Signup";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  // Handlers to switch between modals
  const openLogin = () => {
    setSignupOpen(false);
    setLoginOpen(true);
  };
  const openSignup = () => {
    setLoginOpen(false);
    setSignupOpen(true);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-creative">
              <PenTool className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-creative bg-clip-text text-transparent">
              FreeBoard
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-foreground hover:text-primary transition-colors font-medium">
              Features
            </a>
            <a href="#pricing" className="text-foreground hover:text-primary transition-colors font-medium">
              Pricing
            </a>
            <a href="#about" className="text-foreground hover:text-primary transition-colors font-medium">
              About
            </a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors font-medium">
              Contact
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-foreground hover:text-primary">
                  Sign In
                </Button>
              </DialogTrigger>
              <DialogContent>
                <LoginForm onSuccess={() => setLoginOpen(false)} onSwitchToSignup={openSignup} modal={true} />
              </DialogContent>
            </Dialog>
            <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-creative hover:opacity-90 text-white px-6">
                  Get Started
                </Button>
              </DialogTrigger>
              <DialogContent>
                <SignupForm onSuccess={() => setSignupOpen(false)} onSwitchToLogin={openLogin} modal={true} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close Menu' : 'Open Menu'}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col gap-4">
              <a href="#features" className="text-foreground hover:text-primary transition-colors font-medium">
                Features
              </a>
              <a href="#pricing" className="text-foreground hover:text-primary transition-colors font-medium">
                Pricing
              </a>
              <a href="#about" className="text-foreground hover:text-primary transition-colors font-medium">
                About
              </a>
              <a href="#contact" className="text-foreground hover:text-primary transition-colors font-medium">
                Contact
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
                <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="text-foreground hover:text-primary justify-start">
                      Sign In
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <LoginForm onSuccess={() => setLoginOpen(false)} onSwitchToSignup={openSignup} modal={true} />
                  </DialogContent>
                </Dialog>
                <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-primary to-creative hover:opacity-90 text-white">
                      Get Started
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <SignupForm onSuccess={() => setSignupOpen(false)} onSwitchToLogin={openLogin} modal={true} />
                  </DialogContent>
                </Dialog>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};