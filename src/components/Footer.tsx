import { PenTool, Twitter, Github, Linkedin, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t border-border/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-gray-200">
                <PenTool className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-foreground">
                FreeBoard
              </span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
              The collaborative whiteboard that empowers teams to visualize ideas, 
              create together, and bring concepts to life in real-time.
            </p>
            <div className="flex gap-4">
              <a 
                href="#" 
                className="p-2 rounded-lg bg-gray-200 text-foreground hover:bg-gray-300 hover:text-black transition-all duration-200"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg bg-gray-200 text-foreground hover:bg-gray-300 hover:text-black transition-all duration-200"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg bg-gray-200 text-foreground hover:bg-gray-300 hover:text-black transition-all duration-200"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg bg-gray-200 text-foreground hover:bg-gray-300 hover:text-black transition-all duration-200"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Features</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Templates</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Integrations</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">API</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Press</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/50 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              © 2024 FreeBoard. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};