import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Shield, Users, ArrowRight, Flame, Scale, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import bonfireImage from "@/assets/bonfire-image.png";
import textileBg from "@/assets/textile_bg.png";
import safetyBg from "@/assets/safety.jpg";
import healingBg from "@/assets/healing.jpg";
import justiceBg from "@/assets/justice.jpg";
import empowermentBg from "@/assets/empowerment.jpg";

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={bonfireImage}
            alt=""
            className="h-full w-full object-cover"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        </div>
        <div className="section-container relative">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-8">
              <Flame className="h-4 w-4" />
              Where healing begins
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Safety. Healing. Justice. Empowerment.
            </h1>
            <p className="text-lg text-white/85 leading-relaxed mb-10 max-w-xl mx-auto">
              A safe place where children-survivors of sexual abuse and exploitation can be seen, heard, and loved, supported by
              professional care, dependable systems, and a community that shows up.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/impact">
                  See Our Impact <ArrowRight className="h-5 w-5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-card/50">
        <div className="section-container">
          <h2 className="font-heading text-3xl font-bold text-center mb-4">What we’re building toward</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            The work is holistic (body, mind, and spirit). Our tech exists to serve that mission with dignity and discretion.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "Safety",
                desc: "Protective, confidential workflows that help staff keep young people safe, and feeling safe, day to day.",
                bg: safetyBg,
              },
              {
                icon: Heart,
                title: "Healing",
                desc: "Structured counseling notes, home visits, and care plans that support steady progress over time.",
                bg: healingBg,
              },
              {
                icon: Scale,
                title: "Justice",
                desc: "Tools to coordinate referrals and follow-ups when a survivor chooses to pursue justice, without pressure.",
                bg: justiceBg,
              },
              {
                icon: Sparkles,
                title: "Empowerment",
                desc: "Clear milestones and impact communication that moves from survival to voice, leadership, and reintegration.",
                bg: empowermentBg,
              },
            ].map((item) => (
              <Card key={item.title} className="relative overflow-hidden group">
                {/* Base layout: header (separate) + image (no overlap) */}
                <div className="bg-card p-5">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">{item.title}</h3>
                  </div>
                </div>

                <div className="relative h-44">
                  <img src={item.bg} alt="" className="h-full w-full object-cover" aria-hidden="true" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" aria-hidden="true" />
                </div>

                {/* Hover reveal: an OPAQUE white layer covers header + image, then text appears */}
                <div
                  className="absolute inset-0 z-20 bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  aria-hidden="true"
                />
                <CardContent className="absolute inset-0 z-30 p-6 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex items-center justify-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed text-center px-2">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="section-container">
          <div className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center">
            <div
              className="absolute inset-0 bg-repeat opacity-45"
              style={{ backgroundImage: `url(${textileBg})`, backgroundSize: "520px" }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" aria-hidden="true" />
            <div className="relative">
            <h2 className="font-heading text-3xl font-bold mb-4">Join the movement</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Whether through donation, volunteering, or partnership, your support ignites hope.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/donate">Donate Now</Link>
              </Button>
            </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
