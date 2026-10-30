// Sign-in screen. Any email and password signs in against the mock backend.
import { useEffect, useState } from "react";
import { useLogin } from "@refinedev/core";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { Icon } from "../ds/Icon";
import { LOGO_URL } from "../assets";
import { TextInput } from "./streams/detail/fields";
import { radius } from "../theme/tokens";

export default function LoginPage() {
  const { m3: c } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const { mutate: login, isPending } = useLogin();
  const { control, handleSubmit } = useForm({ defaultValues: { email: "", password: "" } });

  useEffect(() => {
    document.title = "Sign in · Savvy Admin";
  }, []);

  const submit = handleSubmit((values) => {
    setError(null);
    login(values, { onSuccess: (res) => !res?.success && setError(res?.error?.message ?? "Couldn't sign in") });
  });

  return (
    // Same layers as the app: its outer background, the card a panel on it.
    <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", bgcolor: c.background, px: 2, py: 4 }}>
      <Card component="main" sx={{ width: "100%", maxWidth: 420, p: { xs: 3, sm: 5 }, bgcolor: c.surfaceContainerLowest, borderRadius: radius("lg"), border: "none", boxShadow: "none" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 1, mb: 4 }}>
          <Box component="img" src={LOGO_URL} alt="" sx={{ width: 64, height: 64, mb: 1 }} />
          <Typography variant="headlineMedium" component="h1">
            Savvy Admin
          </Typography>
          <Typography variant="bodyMedium" color="text.secondary">
            Sign in to manage streams, users and the Shop.
          </Typography>
        </Box>
        <Box component="form" onSubmit={submit} noValidate sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextInput
            control={control}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus
            rules={{ required: "Enter your email", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" } }}
          />
          <TextInput
            control={control}
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            rules={{ required: "Enter your password" }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)} edge="end">
                      <Icon name={showPassword ? "visibility_off" : "visibility"} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" size="large" disabled={isPending} sx={{ mt: 1 }}>
            {isPending ? "Signing in…" : "Sign in"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
