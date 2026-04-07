import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { HeartHandshake, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Frequency = "one_time" | "monthly";

type DonateFormState = {
  frequency: Frequency;
  amount: number;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  isAnonymous: boolean;
};

const presetAmounts = [25, 50, 100, 250] as const;

/** Demo: historical donations for the grading donor account (INTEX) */
const DEMO_DONOR_HISTORY: { date: string; amount: string; type: string; reference: string }[] = [
  { date: "2025-12-18", amount: "$100.00", type: "One-time", reference: "DN-2025-4412" },
  { date: "2025-09-01", amount: "$50/mo", type: "Monthly", reference: "DN-2025-3891" },
  { date: "2025-06-22", amount: "$250.00", type: "One-time", reference: "DN-2025-2104" },
  { date: "2024-11-15", amount: "$25/mo", type: "Monthly", reference: "DN-2024-9001" },
];

function readNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function DonatePage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [state, setState] = useState<DonateFormState>({
    frequency: "one_time",
    amount: 50,
    firstName: "",
    lastName: "",
    email: "",
    message: "",
    isAnonymous: false,
  });

  const helperText = useMemo(() => {
    if (state.frequency === "monthly") {
      return "Monthly gifts help us plan staffing, counseling, and safe housing with confidence.";
    }
    return "Every gift brings warmth, safety, and steady support to survivors on the long road to healing.";
  }, [state.frequency]);

  const isValidEmail = useMemo(() => {
    const v = state.email.trim();
    return v.length > 3 && v.includes("@") && v.includes(".");
  }, [state.email]);

  const canSubmit =
    state.amount > 0 &&
    state.firstName.trim().length > 0 &&
    state.lastName.trim().length > 0 &&
    isValidEmail;

  useEffect(() => {
    if (!user) return;
    const parts = user.name.trim().split(/\s+/);
    setState((s) => ({
      ...s,
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" ") || "",
      email: user.email,
    }));
  }, [user]);

  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground mt-3 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="py-16">
        <div className="section-container max-w-2xl mx-auto text-center">
          <Badge variant="default" className="mb-4">
            Donate
          </Badge>
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            Sign in to give
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            To protect donor privacy and tie your gift to your impact, Bonfire asks you to sign in
            before completing a donation. If you don&apos;t have an account yet, use the demo donor
            credentials from the sign-in page for this course.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg" asChild>
              <Link to="/login?redirect=/donate">Sign in to donate</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/impact">See our impact first</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-8 leading-relaxed">
            Grading note: use the <strong>donor@bonfire.org</strong> account (no MFA) to view sample
            giving history after login.
          </p>
        </div>
      </div>
    );
  }

  if (submittedId) {
    return (
      <div className="py-16">
        <div className="section-container">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Thank you
            </div>
            <h1 className="font-heading text-4xl font-bold mb-4">
              Your generosity lights the way
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              We received your pledge (demo). We’ll follow up at{" "}
              <span className="font-medium text-foreground">
                {state.email.trim()}
              </span>
              .
            </p>

            <Card className="card-warm text-left">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HeartHandshake className="h-5 w-5 text-primary" />
                  Donation summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Frequency</span>
                  <span className="text-sm font-medium">
                    {state.frequency === "monthly" ? "Monthly" : "One-time"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-medium">${state.amount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reference</span>
                  <span className="text-sm font-mono">{submittedId}</span>
                </div>
              </CardContent>
            </Card>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="hero">
                <Link to="/impact">See the impact you’re part of</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setSubmittedId(null)}
              >
                Make another donation
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16">
      <div className="section-container">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="default" className="mb-4">
              Donate
            </Badge>
            <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
              Help keep the fire burning
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Your gift supports safe housing, counseling, education, and reintegration, so survivors can heal in a place
              that feels like home.
            </p>
          </div>

          {user?.role === "donor" && user.email.toLowerCase() === "donor@bonfire.org" && (
            <Card className="card-warm mb-8">
              <CardHeader>
                <CardTitle className="font-heading">Your giving history</CardTitle>
                <p className="text-sm text-muted-foreground font-normal">
                  Sample history for the grading donor account (INTEX requirement).
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-left">
                        <th className="p-3 font-medium text-muted-foreground">Date</th>
                        <th className="p-3 font-medium text-muted-foreground">Type</th>
                        <th className="p-3 font-medium text-muted-foreground">Amount</th>
                        <th className="p-3 font-medium text-muted-foreground hidden sm:table-cell">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DEMO_DONOR_HISTORY.map((row) => (
                        <tr key={row.reference} className="border-b border-border last:border-0">
                          <td className="p-3">{row.date}</td>
                          <td className="p-3">{row.type}</td>
                          <td className="p-3 font-medium">{row.amount}</td>
                          <td className="p-3 font-mono text-xs hidden sm:table-cell">{row.reference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-3">
              <Card className="card-warm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HeartHandshake className="h-5 w-5 text-primary" />
                    Make a donation
                  </CardTitle>
                  {user && (
                    <p className="text-sm text-muted-foreground font-normal">
                      Signed in as <span className="font-medium text-foreground">{user.email}</span>
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                        state.frequency === "one_time"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-accent"
                      }`}
                      onClick={() =>
                        setState((s) => ({ ...s, frequency: "one_time" }))
                      }
                    >
                      <p className="font-medium">One-time</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Give once, make an immediate difference.
                      </p>
                    </button>
                    <button
                      type="button"
                      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                        state.frequency === "monthly"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-accent"
                      }`}
                      onClick={() =>
                        setState((s) => ({ ...s, frequency: "monthly" }))
                      }
                    >
                      <p className="font-medium">Monthly</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Sustain long-term healing and care.
                      </p>
                    </button>
                  </div>

                  <p className="text-sm text-muted-foreground">{helperText}</p>

                  <div className="space-y-3">
                    <Label>Choose an amount</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {presetAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          className={`rounded-xl border px-4 py-3 text-center font-medium transition-colors ${
                            state.amount === amt
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-accent"
                          }`}
                          onClick={() => setState((s) => ({ ...s, amount: amt }))}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-2">
                        <Label htmlFor="customAmount">Custom amount</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input
                            id="customAmount"
                            inputMode="numeric"
                            className="pl-7"
                            value={state.amount.toString()}
                            onChange={(e) =>
                              setState((s) => ({
                                ...s,
                                amount: Math.max(0, readNumber(e.target.value)),
                              }))
                            }
                            aria-describedby="amountHelp"
                          />
                        </div>
                        <p id="amountHelp" className="text-xs text-muted-foreground">
                          This is a demo form (no payment processing yet).
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Make it anonymous</Label>
                        <button
                          type="button"
                          className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                            state.isAnonymous
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-accent"
                          }`}
                          onClick={() =>
                            setState((s) => ({ ...s, isAnonymous: !s.isAnonymous }))
                          }
                          aria-pressed={state.isAnonymous}
                        >
                          <p className="font-medium">
                            {state.isAnonymous ? "Yes (anonymous)" : "No (show my name)"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            We’ll still email your receipt.
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name</Label>
                      <Input
                        id="firstName"
                        value={state.firstName}
                        onChange={(e) =>
                          setState((s) => ({ ...s, firstName: e.target.value }))
                        }
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name</Label>
                      <Input
                        id="lastName"
                        value={state.lastName}
                        onChange={(e) =>
                          setState((s) => ({ ...s, lastName: e.target.value }))
                        }
                        autoComplete="family-name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={state.email}
                      onChange={(e) =>
                        setState((s) => ({ ...s, email: e.target.value }))
                      }
                      autoComplete="email"
                    />
                    {!isValidEmail && state.email.trim().length > 0 && (
                      <p className="text-xs text-destructive">
                        Enter a valid email address.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message (optional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Share what inspired your support…"
                      value={state.message}
                      onChange={(e) =>
                        setState((s) => ({ ...s, message: e.target.value }))
                      }
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                    <Button variant="outline" asChild>
                      <Link to="/impact">Review impact first</Link>
                    </Button>
                    <Button
                      variant="hero"
                      size="lg"
                      disabled={!canSubmit}
                      onClick={() => {
                        const reference = `DN-${crypto.randomUUID()
                          .split("-")[0]
                          .toUpperCase()}`;
                        setSubmittedId(reference);
                        toast({
                          title: "Donation received (demo)",
                          description: "This is a placeholder until payment is wired up.",
                        });
                      }}
                    >
                      Donate ${state.amount}
                      {state.frequency === "monthly" ? "/mo" : ""}
                    </Button>
                  </div>

                  <div className="flex items-start gap-3 text-xs text-muted-foreground pt-2">
                    <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <p className="leading-relaxed">
                      We take privacy seriously. Learn how we use your data in our{" "}
                      <Link to="/privacy" className="text-primary hover:underline">
                        privacy policy
                      </Link>
                      .
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card className="card-warm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    What your gift supports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: "Safe housing", desc: "Warm beds, meals, and secure spaces where healing begins." },
                    { title: "Counseling", desc: "Trauma-informed sessions and consistent follow-up care." },
                    { title: "Education & skills", desc: "Learning plans that rebuild confidence and independence." },
                    { title: "Reintegration", desc: "Support for safe placements and long-term stability." },
                  ].map((item) => (
                    <div key={item.title} className="p-4 rounded-xl border border-border bg-card">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="card-warm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Security & confidentiality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Survivor information is never shared on public pages. Impact data is
                    anonymized and aggregated.
                  </p>
                  <p>
                    This donation page is a demo experience today; payment processing will be
                    added later with secure, audited providers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

