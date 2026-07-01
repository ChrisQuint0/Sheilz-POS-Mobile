import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from "react-native";
import { usePOSStore } from "../../store/usePOSStore";
import { supabase } from "../../lib/supabase";
import { resolveProfile } from "../../lib/auth";
import {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
} from "../../constants/theme";
import AppText from "../../components/ui/AppText";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function LoginScreen() {
  const { login } = usePOSStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert("Please enter both email and password.");
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (authError || !authData.user) {
      setLoading(false);
      alert(authError?.message ?? "Invalid email or password.");
      return;
    }

    const profile = await resolveProfile(authData.user.id);

    if (!profile) {
      setLoading(false);
      alert(
        "Unable to sign in. Your profile could not be found or your account is inactive. Contact the administrator.",
      );
      return;
    }

    setLoading(false);
    login(profile);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <Image
            source={require("../../../assets/shielz_pos_logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <AppText style={styles.title}>SHIELZ POS</AppText>
          <AppText style={styles.subtitle}>
            Sign in to access the terminal
          </AppText>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Email Address</AppText>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="cashier@sheilz.com"
                placeholderTextColor={COLORS.stone400}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <AppText style={styles.label}>Password</AppText>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.stone400}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            disabled={loading}
          >
            <AppText style={styles.loginBtnText}>
              {loading ? "Signing in..." : "Login"}
            </AppText>
          </TouchableOpacity>

          <View style={styles.footer}>
            <AppText style={styles.footerText}>
              Need access? Contact the administrator.
            </AppText>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.surface,
    width: "100%",
    maxWidth: isTablet ? 450 : 380,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    elevation: 5,
    shadowColor: COLORS.espresso,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.xxl,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.espresso,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif" }),
    marginBottom: 4,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textLight,
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.stone100,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    paddingLeft: SPACING.md,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: SPACING.sm,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
  },
  eyeBtn: {
    padding: SPACING.md,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: SPACING.md,
  },
  loginBtnText: {
    color: COLORS.surface,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xl,
    gap: 6,
    paddingHorizontal: SPACING.md,
  },
  footerText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textLight,
    flexShrink: 1,
    textAlign: "center",
  },
});
