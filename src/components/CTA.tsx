import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-20 relative bg-background border-t border-b border-muted-foreground/10">
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-muted/30">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Ready to Transform
            <br />
            <span className="bg-gradient-to-r from-primary to-creative bg-clip-text text-transparent">
              Your Ideas?
            </span>
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of teams already using our whiteboard to bring their best ideas to life. Start creating today, completely free.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              size="lg" 
              className="bg-primary text-white hover:bg-primary/90 text-lg px-8 py-5 rounded-lg shadow-none border-none"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-muted-foreground/20 text-foreground hover:bg-muted/10 text-lg px-8 py-5 rounded-lg"
            >
              Contact Sales
            </Button>
          </div>

          {/* Features List */}
          <div className="flex flex-wrap justify-center gap-6 text-muted-foreground text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};