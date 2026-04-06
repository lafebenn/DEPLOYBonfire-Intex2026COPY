import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Shield, Users, ArrowRight, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import bonfireImage from "@/assets/bonfire-image.png";
import textileBg from "@/assets/textile_bg.png";

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
              A light in the darkness for trafficking survivors
            </h1>
            <p className="text-lg text-white/85 leading-relaxed mb-10 max-w-xl mx-auto">
              Bonfire empowers organizations to protect, rehabilitate, and restore hope to survivors through compassionate case management and community support.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/impact">
                  See Our Impact <ArrowRight className="h-5 w-5 ml-1" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/70 text-white bg-white/0 hover:bg-white/10 hover:border-white"
                asChild
              >
                <Link to="/login">Staff Portal</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-card/50">
        <div className="section-container">
          <h2 className="font-heading text-3xl font-bold text-center mb-4">Built on compassion</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            Every feature is designed with survivor wellbeing at the center.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Safety First", desc: "Secure, confidential case management that protects survivor privacy at every level." },
              { icon: Heart, title: "Donor Engagement", desc: "Transparent impact tracking that connects donors to the lives they're changing." },
              { icon: Users, title: "Collaborative Care", desc: "Team-based tools for case conferences, home visits, and holistic support planning." },
            ].map((item) => (
              <Card key={item.title} className="text-center p-8">
                <CardContent className="pt-0 p-0">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
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
              Whether through donation, volunteering, or partnership — your support ignites hope.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/donate">Donate Now</Link>
              </Button>
              <Button variant="outline" size="lg">Get In Touch</Button>
            </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
