"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation"; // Use next/navigation for App Router

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }), // Add more validation later
});

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    console.log("Attempting sign in with:", values.email);

    try {
      const result = await signIn("credentials", {
        redirect: false, // Handle redirect manually
        email: values.email,
        password: values.password,
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "Invalid email or password." : result.error);
        setIsLoading(false);
      } else if (result?.ok) {
        // Sign-in successful
        console.log("Sign in successful, redirecting...");
        router.push("/"); // Redirect to home page after successful login
        router.refresh(); // Refresh server components
      } else {
        setError("An unknown error occurred during sign in.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Sign in exception:", err);
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Login</CardTitle>
          <CardDescription>Access your saved models and searches.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} type="email" disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
          {/* Add links for registration or password reset later */}
          {/* <div className="mt-4 text-center text-sm">
            Don't have an account? <a href="/register" className="underline">Sign up</a>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}

