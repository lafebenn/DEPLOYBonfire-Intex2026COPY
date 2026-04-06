import { Flame } from "lucide-react";
import { Link } from "react-router-dom";

export function BonfireLogo({ size = "default" }: { size?: "default" | "lg" }) {
  const iconSize = size === "lg" ? 28 : 20;
  const textSize = size === "lg" ? "text-2xl" : "text-xl";

  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="relative">
        <Flame className="text-primary transition-transform group-hover:scale-110" size={iconSize} />
        <Flame className="text-primary/30 absolute inset-0 animate-glow" size={iconSize} />
      </div>
      <span className={`font-heading font-bold ${textSize} text-foreground`}>Bonfire</span>
    </Link>
  );
}
