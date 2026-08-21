import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, User, UserCheck, Lock, KeyRound } from 'lucide-react';
import { sendPhoneOtp, verifyPhoneOtp } from '../services/supabase';
import { checkUserPhone, loginUserAccount, registerUserAccount, forgotPasswordApi } from '../services/api';
import type { UserRole } from '../types';

import type { Language } from '../i18n';

interface AuthScreenProps {
  language?: Language;
  onAuthenticated: (session: any, role?: UserRole, profileSetupCompleted?: boolean) => void;
}

type AuthMode = 'check_phone' | 'existing_login' | 'verify_otp' | 'choose_role' | 'set_password' | 'forgot_password_otp' | 'reset_password';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthenticated
}) => {
  const [mode, setMode] = useState<AuthMode>('check_phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('SENIOR');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Initial Phone Check
  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMessage("Please enter a valid 10-digit mobile phone number.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setStatusMessage("Checking phone number...");

    try {
      const checkRes = await checkUserPhone(phoneNumber);
      if (checkRes.exists) {
        // Existing user flow -> Show Password Login
        setMode('existing_login');
        setStatusMessage("Welcome back! Please enter your password.");
      } else {
        // New user flow -> Send OTP first before creating account
        setStatusMessage("New user registration. Sending OTP code to your mobile...");
        const otpRes = await sendPhoneOtp(phoneNumber);
        if (otpRes.success) {
          setMode('verify_otp');
          setStatusMessage(`Verification code sent to +91 ${cleanPhone}`);
        } else {
          setErrorMessage("Could not send OTP code. Please try again.");
        }
      }
    } catch (err: any) {
      setErrorMessage("Unable to verify phone number. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Existing User Password Login
  const handleExistingLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage("Please enter your account password.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setStatusMessage("Authenticating password...");

    try {
      const res = await loginUserAccount({ phone: phoneNumber, password });
      const mockSession = {
        user: { id: res.user.id, phone: res.user.phone || phoneNumber },
        access_token: res.access_token
      };
      onAuthenticated(mockSession, res.user.role as UserRole, res.user.profile_setup_completed);
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid password. Please check and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify OTP Code (New User Registration)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setErrorMessage("Please enter the verification code received on your phone.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setStatusMessage("Verifying OTP code...");

    try {
      const res = await verifyPhoneOtp(phoneNumber, otpCode);
      if (res.session) {
        if (mode === 'forgot_password_otp') {
          setMode('reset_password');
          setStatusMessage("OTP verified successfully. Create a new password.");
        } else {
          // Proceed to Role Selection
          setMode('choose_role');
          setStatusMessage("Phone number verified! Select your marketplace account role.");
        }
      } else {
        setErrorMessage("Invalid verification code. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage("Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Role Selection Confirmation
  const handleConfirmRole = (role: UserRole) => {
    setSelectedRole(role);
    setMode('set_password');
    setErrorMessage(null);
    setStatusMessage(`Selected ${role === 'SENIOR' ? 'Senior Citizen' : 'Customer'} role. Create your account password.`);
  };

  // 5. Create Account Password & Finalize Registration
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setStatusMessage("Creating your SilverHands account...");

    try {
      const res = await registerUserAccount({
        phone: phoneNumber,
        role: selectedRole,
        password: password
      });

      const mockSession = {
        user: { id: res.user.id, phone: res.user.phone || phoneNumber },
        access_token: res.access_token
      };

      onAuthenticated(mockSession, res.user.role as UserRole, res.user.profile_setup_completed);
    } catch (err: any) {
      setErrorMessage(err.message || "Account creation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Forgot Password — Initiate OTP
  const handleStartForgotPassword = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    setStatusMessage("Sending OTP for password reset...");

    try {
      const otpRes = await sendPhoneOtp(phoneNumber);
      if (otpRes.success) {
        setMode('forgot_password_otp');
        setStatusMessage(`Verification code sent to +91 ${phoneNumber.replace(/[^0-9]/g, '')}`);
      } else {
        setErrorMessage("Could not send verification code.");
      }
    } catch (err) {
      setErrorMessage("Could not initiate password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Reset Password Finalization
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    setStatusMessage("Updating password...");

    try {
      await forgotPasswordApi({ phone: phoneNumber, newPassword: password });
      setStatusMessage("Password updated successfully! Please log in.");
      setPassword('');
      setConfirmPassword('');
      setMode('existing_login');
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-5 sm:p-8 shadow-2xl border border-blue-100 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-3xl font-extrabold text-blue-950 tracking-tight">
            Welcome to SilverHands
          </h1>
          <p className="text-sm text-blue-800 font-semibold">
            Senior-First Digital Livelihood Marketplace
          </p>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-950 font-bold text-xs sm:text-sm flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusMessage && !errorMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* STEP 1: Phone Check */}
        {mode === 'check_phone' && (
          <form onSubmit={handleCheckPhone} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
                Mobile Phone Number
              </label>
              <div className="flex items-center rounded-2xl border-2 border-blue-200 focus-within:border-blue-600 bg-white overflow-hidden shadow-xs">
                <span className="px-4 py-4 bg-blue-50 text-blue-950 font-extrabold text-lg border-r border-blue-200">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="9876543210"
                  className="w-full p-4 text-xl font-bold text-zinc-900 focus:outline-none tracking-wide"
                />
              </div>
              <p className="text-xs text-zinc-500 font-medium">Enter your 10-digit mobile phone number</p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-lg flex items-center justify-center space-x-3 transition-all shadow-xl cursor-pointer min-h-[56px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Existing User Login */}
        {mode === 'existing_login' && (
          <form onSubmit={handleExistingLogin} className="space-y-5">
            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-center justify-between text-xs">
              <span className="font-bold text-blue-950">+91 {phoneNumber.replace(/[^0-9]/g, '')}</span>
              <button
                type="button"
                onClick={() => {
                  setMode('check_phone');
                  setErrorMessage(null);
                }}
                className="text-blue-700 font-bold hover:underline"
              >
                Change Number
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
                Enter Account Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-4 pl-11 rounded-2xl border-2 border-blue-200 focus:border-blue-600 text-lg font-bold text-zinc-900"
                />
                <Lock className="w-5 h-5 text-zinc-400 absolute left-4 top-4" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-lg flex items-center justify-center space-x-3 transition-all shadow-xl cursor-pointer min-h-[56px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleStartForgotPassword}
                className="text-xs font-extrabold text-blue-700 hover:underline cursor-pointer"
              >
                Forgot Password? Reset via OTP
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: OTP Verification */}
        {(mode === 'verify_otp' || mode === 'forgot_password_otp') && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-zinc-900 uppercase tracking-wider">
                  Enter 6-Digit OTP Code
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('check_phone');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-blue-700 font-bold hover:underline"
                >
                  Change Number
                </button>
              </div>

              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full p-4 text-center text-3xl font-extrabold text-zinc-900 tracking-[0.5em] rounded-2xl border-2 border-blue-300 focus:border-blue-600 bg-blue-50/40"
              />
              <p className="text-xs text-zinc-500 font-medium text-center">
                Check SMS sent to +91 {phoneNumber.replace(/[^0-9]/g, '')}
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !otpCode.trim()}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-lg flex items-center justify-center space-x-3 transition-all shadow-xl cursor-pointer min-h-[56px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Choose Role (New User Only) */}
        {mode === 'choose_role' && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-zinc-900">Select Your Account Role</h3>
              <p className="text-xs text-zinc-500 font-medium">How will you be using SilverHands?</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                type="button"
                onClick={() => handleConfirmRole('SENIOR')}
                className="p-5 rounded-2xl border-2 border-blue-200 hover:border-blue-600 bg-white hover:bg-blue-50/60 transition-all text-left space-y-2 shadow-xs cursor-pointer min-h-[56px]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-zinc-900">Senior Citizen / Homemaker</h4>
                    <p className="text-xs text-zinc-500 font-semibold">Share your skills, offer local services, manage requests</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmRole('CUSTOMER')}
                className="p-5 rounded-2xl border-2 border-blue-200 hover:border-blue-600 bg-white hover:bg-blue-50/60 transition-all text-left space-y-2 shadow-xs cursor-pointer min-h-[56px]"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-zinc-900">Customer / Neighbor</h4>
                    <p className="text-xs text-zinc-500 font-semibold">Discover senior experts, request services, write reviews</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Set New Password (Registration) */}
        {mode === 'set_password' && (
          <form onSubmit={handleCreateAccount} className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-zinc-900">Create Account Password</h3>
              <p className="text-xs text-zinc-500 font-medium">Set a secure password for your +91 {phoneNumber.replace(/[^0-9]/g, '')} account</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">
                  Create Password (min 6 characters)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-4 pl-11 rounded-2xl border-2 border-blue-200 focus:border-blue-600 text-base font-bold text-zinc-900"
                  />
                  <KeyRound className="w-5 h-5 text-zinc-400 absolute left-4 top-4" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-4 pl-11 rounded-2xl border-2 border-blue-200 focus:border-blue-600 text-base font-bold text-zinc-900"
                  />
                  <KeyRound className="w-5 h-5 text-zinc-400 absolute left-4 top-4" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || password.length < 6}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-lg flex items-center justify-center space-x-3 transition-all shadow-xl cursor-pointer min-h-[56px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Log In</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 6: Reset Password (Forgot Password) */}
        {mode === 'reset_password' && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-extrabold text-zinc-900">Reset Account Password</h3>
              <p className="text-xs text-zinc-500 font-medium">Enter your new password below</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">
                  New Password (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-4 rounded-2xl border-2 border-blue-200 focus:border-blue-600 text-base font-bold text-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-zinc-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-4 rounded-2xl border-2 border-blue-200 focus:border-blue-600 text-base font-bold text-zinc-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || password.length < 6}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold text-lg flex items-center justify-center space-x-3 transition-all shadow-xl cursor-pointer min-h-[56px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Update Password & Log In</span>
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
