import { Card } from "@/components/ui/card";
import { 
  Palette, 
  MousePointer, 
  Share2, 
  Shapes, 
  Type, 
  Zap,
  Users,
  Download,
  Smartphone
} from "lucide-react";

const features = [
  {
    icon: <MousePointer className="h-8 w-8" />,
    title: "Freehand Drawing",
    description: "Draw naturally with your mouse, stylus, or touch. Enjoy smooth, responsive lines for sketches, diagrams, and notes."
  },
  {
    icon: <Type className="h-8 w-8" />,
    title: "Text & Annotations",
    description: "Add text anywhere on the canvas. Create sticky notes, labels, and rich annotations to clarify your ideas."
  },
  {
    icon: <Shapes className="h-8 w-8" />,
    title: "Shapes & Arrows",
    description: "Insert rectangles, circles, lines, and arrows. Snap and connect shapes to build flowcharts, diagrams, and mind maps."
  },
  {
    icon: <Palette className="h-8 w-8" />,
    title: "Color & Style Controls",
    description: "Choose from unlimited colors, adjust stroke width, opacity, and add gradients for expressive visuals."
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Real-time Collaboration",
    description: "Work together live. See others' cursors, edits, and comments instantly—perfect for teams and classrooms."
  },
  {
    icon: <Share2 className="h-8 w-8" />,
    title: "Easy Sharing & Export",
    description: "Share your whiteboard with a link, or export as PNG, SVG, or PDF for presentations and documentation."
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Lightning Fast & Responsive",
    description: "Enjoy instant feedback and smooth performance, even on large boards or mobile devices."
  },
  {
    icon: <Download className="h-8 w-8" />,
    title: "Cloud Save & Access Anywhere",
    description: "Your boards are always available—access them from any device, anytime."
  },
  {
    icon: <Smartphone className="h-8 w-8" />,
    title: "Mobile & Tablet Ready",
    description: "Draw, write, and collaborate on the go with full support for touch and stylus input."
  }
];

export const Features = () => {
  return (
    <section className="py-20 bg-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Everything You Need to Create
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Powerful tools designed for seamless creativity and collaboration. 
            From quick sketches to complex diagrams, we've got you covered.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 bg-white/80 backdrop-blur-sm"
            >
              <div className="flex items-center mb-4">
                <div className="p-3 rounded-lg bg-gray-200 text-foreground mr-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};