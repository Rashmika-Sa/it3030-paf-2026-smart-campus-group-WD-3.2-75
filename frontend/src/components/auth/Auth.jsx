import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Hash, GraduationCap, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

export default function Auth() {
  const sliitEmailRegex = /^(IT|BM|EN)\d+@my.sliit.lk$/i;
  const location = useLocation();
  const navigate = useNavigate(); 
  const [isLogin, setIsLogin] = useState(location.state?.isRegister ? false : true);
  const [isLoading, setIsLoading] = useState(false); 
  const [errorMessage, setErrorMessage] = useState(""); 

  useEffect(() => {
    if (location.state?.isRegister !== undefined) {
      setIsLogin(!location.state.isRegister);
      setErrorMessage(""); 
    }
  }, [location.state]);

  //AUTHENTICATION LOGIC
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const email = e.target.email.value.trim();
    if (!sliitEmailRegex.test(email)) {
      setErrorMessage("Email must be IT/BM/EN + numbers and end with @my.sliit.lk (example: IT22000000@my.sliit.lk)");
      return;
   }

   setIsLoading(true);

    // Gather data from the inputs using their 'name' attributes
    const formData = {
      email,
      password: e.target.password.value,
      ...( !isLogin && { 
        fullName: e.target.fullName.value, 
        sliitId: e.target.sliitId.value 
      })
    };

    const backendUrl = "http://localhost:8081"; 
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        navigate('/dashboard'); 
      } else {
        // Backend error 
        setErrorMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Server connection failed:", error);
      setErrorMessage("Could not connect to the server. Is your backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setErrorMessage("");
      
      try {
        // Send the Google access token to your backend
        const response = await fetch("http://localhost:8081/api/auth/google", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // We send the token so your backend can verify it with Google
          body: JSON.stringify({ token: tokenResponse.access_token }), 
        });

        const data = await response.json();

        if (response.ok) {

          localStorage.setItem('token', data.token);
          navigate('/dashboard'); 
        } else {
          setErrorMessage(data.message || "Failed to authenticate with Google.");
        }
      } catch (error) {
        console.error("Google backend connection failed:", error);
        setErrorMessage("Could not connect to the server.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google Popup Error:", error);
      setErrorMessage("Google Authentication failed or was canceled.");
    }
  });

  return (
    <div className="min-h-screen flex bg-gray-50">
      
      {/* LEFT SIDE: Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#222222] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-sliit-gold/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-sliit-gold/10 rounded-full blur-3xl"></div>

        <div className="flex items-center gap-2 relative z-10">
          <GraduationCap className="h-10 w-10 text-sliit-gold" />
          <span className="text-2xl font-bold tracking-tight text-white">
            SLIIT-HUB<span className="text-sliit-gold">.</span>
          </span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-4xl font-extrabold text-white mb-6 leading-tight">
            {isLogin ? "Welcome back to your campus hub." : "Start your smart campus journey today."}
          </h1>
          <p className="text-gray-400 text-lg">
            {isLogin 
              ? "Access your dashboard, manage bookings, and stay updated with real-time campus notifications." 
              : "Create an account using your official SLIIT student ID to unlock all platform features."}
          </p>
        </div>

        <div className="relative z-10 text-sm text-gray-500 font-medium">
          © {new Date().getFullYear()} SLIIT Smart Campus Platform
        </div>
      </div>

      {/* RIGHT SIDE: Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-[#222222] transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100">
          
          <h2 className="text-3xl font-extrabold text-[#222222] mb-2">
            {isLogin ? "Sign In" : "Create Account"}
          </h2>
          <p className="text-gray-500 mb-6">
            {isLogin ? "Please enter your credentials." : "Fill in your details to get started."}
          </p>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-slide-up">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
            </div>
          )}

          <button 
            onClick={handleGoogleAuth}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 text-[#222222] rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm mb-6"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <hr className="flex-1 border-gray-200" />
            <span className="text-sm text-gray-400 font-medium uppercase tracking-wider">or email</span>
            <hr className="flex-1 border-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  {/* ADDED: name="fullName" */}
                  <input type="text" name="fullName" placeholder="Full Name" required className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sliit-gold focus:ring-2 focus:ring-yellow-100 outline-none transition-all" />
                </div>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  {/* ADDED: name="sliitId" */}
                  <input type="text" name="sliitId" placeholder="SLIIT ID Number (e.g. IT22000000)" required className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sliit-gold focus:ring-2 focus:ring-yellow-100 outline-none transition-all uppercase" />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              {/* ADDED: name="email" */}
              <input type="email" name="email" placeholder={isLogin ? "Email Address" : "SLIIT Student Email"} required className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sliit-gold focus:ring-2 focus:ring-yellow-100 outline-none transition-all" />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              {/* ADDED: name="password" */}
              <input type="password" name="password" placeholder="Password" required className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-sliit-gold focus:ring-2 focus:ring-yellow-100 outline-none transition-all" />
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <a href="#forgot" className="text-sm font-semibold text-gray-500 hover:text-sliit-gold transition-colors">Forgot Password?</a>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-4 bg-sliit-gold hover:bg-yellow-500 text-[#222222] rounded-xl font-bold text-lg transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#222222]" />
              ) : (
                isLogin ? "Sign In" : "Register Now"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMessage(""); // Clear error when switching
              }} 
              className="text-yellow-600 hover:text-sliit-gold font-bold underline transition-colors"
            >
              {isLogin ? "Create one" : "Sign in here"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}