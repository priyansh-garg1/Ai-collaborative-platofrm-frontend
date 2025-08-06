import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export const CTA = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Simple Gray Background */}
      <div className="absolute inset-0 bg-gray-100 opacity-95" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-gray-200 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-56 h-56 bg-gray-300 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gray-100 rounded-full blur-xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-gray-200 backdrop-blur-sm">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
            Ready to Transform
            <br />
            <span className="text-foreground">
              Your Ideas?
            </span>
          </h2>

          {/* Description */}
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of teams already using our whiteboard to bring their best ideas to life. 
            Start creating today, completely free.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-gray-200 text-xl px-10 py-7 rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-200"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="border-gray-300 text-foreground hover:bg-gray-200 text-xl px-10 py-7 rounded-xl backdrop-blur-sm"
            >
              Contact Sales
            </Button>
          </div>

          {/* Features List */}
          <div className="flex flex-wrap justify-center gap-6 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};