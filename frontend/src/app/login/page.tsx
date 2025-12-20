"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./login.module.css";
import { Suspense } from "react";

function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginByBpjs } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role");
  const isPatient = role === "patient";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isPatient) {
        await loginByBpjs(identifier);
      } else {
        await login(identifier, password);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>MediKu</h1>
          <p className={styles.subtitle}>
            {isPatient ? "Login Pasien" : "Silakan login untuk melanjutkan"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="identifier" className={styles.label}>
              {isPatient ? "Nomor BPJS" : "Email"}
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={styles.input}
              placeholder={
                isPatient ? "Masukkan Nomor BPJS" : "admin@mediku.com"
              }
              required
            />
          </div>

          {!isPatient && (
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? "Loading..." : "Login"}
          </button>
        </form>

        <div className={styles.demo}>
          {isPatient ? (
            <>
              <p>Demo Pasien:</p>
              <code>BPJS: 000123456789</code>
            </>
          ) : (
            <>
              <p>Demo Credentials:</p>
              <code>admin@mediku.com / password123</code>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
