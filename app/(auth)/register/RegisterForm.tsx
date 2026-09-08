"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { useRegisterMutation } from "@/src/store/api/authApi";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name needs at least 2 characters").max(80),
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/, "3–30 chars: a-z, 0-9, _")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

type RegisterForm = z.infer<typeof registerSchema>;

/** Register via Express → auto sign-in via Auth.js credentials. */
export function RegisterForm() {
  const router = useRouter();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await registerUser(values).unwrap();
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "Registration failed. Try a different email or username.";
      setServerError(message);
      return;
    }
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    if (result?.error) {
      router.push("/login");
      return;
    }
    router.push("/");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Input
        label="Name"
        autoComplete="name"
        required
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        required
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        label="Username"
        autoComplete="username"
        placeholder="e.g. jane_writes"
        hint="Optional — 3–30 chars: a-z, 0-9, _"
        error={errors.username?.message}
        {...register("username")}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        error={errors.password?.message}
        {...register("password")}
      />
      {serverError && (
        <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {serverError}
        </div>
      )}
      <Button type="submit" disabled={isLoading} className="w-full" size="lg">
        {isLoading ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Have an account?{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300">
          Sign in
        </Link>
      </p>
    </form>
  );
}
